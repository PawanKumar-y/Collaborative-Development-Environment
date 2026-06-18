const Y = require('yjs')
const syncProtocol = require('y-protocols/sync')
const awarenessProtocol = require('y-protocols/awareness')
const encoding = require('lib0/encoding')
const decoding = require('lib0/decoding')
const Room = require('../Collections/roomCollection')
const jwt = require('jsonwebtoken')
// In-memory map of roomId -> { doc: Y.Doc, connectedUsers: Set<socketId> }
const roomDocs = new Map()

/**
 * Initialize or retrieve a Y.Doc for a room
 * On first init, load content from DB
 */
const getOrCreateDoc = async (roomId) => {
    if (roomDocs.has(roomId)) {
        return roomDocs.get(roomId).doc
    }

    const ydoc = new Y.Doc()

    // Load existing content from DB
    try {
        const room = await Room.findOne({ room_id: roomId })
        if (room && room.content) {
            const update = Buffer.from(room.content, 'base64')
            Y.applyUpdate(ydoc, update)
        }
    } catch (err) {
        console.error(`Error loading doc for room ${roomId}:`, err)
    }

    roomDocs.set(roomId, {
        doc: ydoc,
        connectedUsers: new Set()
    })

    return ydoc
}

/**
 * Encode update message for Yjs sync
 */
const encodeUpdate = (update) => {
    const encoder = encoding.createEncoder()
    encoding.writeVarUint8Array(encoder, update)
    return Buffer.from(encoding.toUint8Array(encoder))
}

/**
 * Decode message from client
 */
const decodeMessage = (message) => {
    const decoder = decoding.createDecoder(message)
    return decoder
}

/**
 * Main Socket.io setup for Yjs
 */
const setupYjsSocketHandlers = (io) => {
    io.on('connection', (socket) => {
        //const userEmail = socket.handshake.auth.token // Token is passed in auth
        let userEmail = null
        try {
            const token = socket.handshake.auth.token
            if (token) {
                const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_secret_key')
                userEmail = decoded.email || decoded.user?.email
            }
        } catch (err) {
            console.error('JWT decode error:', err.message)
            socket.disconnect()
            return
        }
        socket.on('sync-step-0', async (data) => {
            const { room: roomId } = data

            if (!roomId) return

            try {
                // Get or create the doc
                const ydoc = await getOrCreateDoc(roomId)
                const roomData = roomDocs.get(roomId)

                // Track user connection
                roomData.connectedUsers.add(socket.id)
                socket.join(roomId) // Join Socket.io room

                // Send initial state to client (sync-step-1)
                const state = Y.encodeStateAsUpdate(ydoc)
                const encoder = encoding.createEncoder()
                encoding.writeVarUint8Array(encoder, state)

                socket.emit('sync-step-1', {
                    room: roomId,
                    update: Buffer.from(encoding.toUint8Array(encoder))
                })

                console.log(`User ${userEmail} joined room ${roomId}`)
            } catch (err) {
                console.error('Error in sync-step-0:', err)
            }
        })

        /**
         * Receive updates from client (keystroke-level changes)
         * Broadcast to all users in the room
         */
        socket.on('update', (data) => {
            const { room: roomId, update: updateBuffer } = data

            if (!roomId || !updateBuffer) return

            try {
                const roomData = roomDocs.get(roomId)
                if (!roomData) return

                const ydoc = roomData.doc
                const update = new Uint8Array(updateBuffer)

                // Apply update to server's doc
                Y.applyUpdate(ydoc, update)

                // Broadcast to all other users in the room (not sender)
                socket.to(roomId).emit('update', {
                    room: roomId,
                    update: updateBuffer
                })
            } catch (err) {
                console.error('Error processing update:', err)
            }
        })

        /**
         * Save room to DB (Ctrl+S)
         * Triggered by frontend: provider.socket.emit('save-room', { roomId })
         */
        socket.on('save-room', async (data) => {
            const { roomId } = data

            if (!roomId) return

            try {
                const roomData = roomDocs.get(roomId)
                if (!roomData) return

                const ydoc = roomData.doc

                // Serialize Y.Doc to buffer
                const update = Y.encodeStateAsUpdate(ydoc)
                const contentBase64 = Buffer.from(update).toString('base64')

                // Find the room and update content + timestamps
                await Room.updateOne(
                    { room_id: roomId },
                    {
                        content: contentBase64,
                        lastModifiedAt: new Date(),
                        $set: { 'collaborators.$[elem].lastEditedAt': new Date() },
                        arrayFilters: [{ 'elem.user_id': userEmail }]
                    }
                )

                console.log(`Room ${roomId} saved by ${userEmail}`)

                // Notify all users in room that save succeeded
                io.to(roomId).emit('save-success', { roomId })
            } catch (err) {
                console.error('Error saving room:', err)
                socket.emit('save-error', { msg: 'Failed to save room' })
            }
        })

        /**
         * User disconnects from a room
         * If room is empty, cleanup the Y.Doc
         */
        socket.on('disconnect', () => {
            // Check all rooms this user was in
            roomDocs.forEach((roomData, roomId) => {
                if (roomData.connectedUsers.has(socket.id)) {
                    roomData.connectedUsers.delete(socket.id)

                    // If room is now empty, destroy the doc to free memory
                    if (roomData.connectedUsers.size === 0) {
                        roomData.doc.destroy()
                        roomDocs.delete(roomId)
                        console.log(`Room ${roomId} cleaned up (no more users)`)
                    }
                }
            })

            console.log(`User ${userEmail} disconnected`)
        })

        /**
         * Awareness protocol (presence: colored cursors/avatars)
         * Handled by y-socket.io automatically, but we can add custom logic if needed
         */
        socket.on('awareness', (data) => {
            // y-socket.io handles this internally
            // Just relay to other users in the room
            const { room: roomId } = data
            if (roomId) {
                socket.to(roomId).emit('awareness', data)
            }
        })
    })
}

module.exports = setupYjsSocketHandlers