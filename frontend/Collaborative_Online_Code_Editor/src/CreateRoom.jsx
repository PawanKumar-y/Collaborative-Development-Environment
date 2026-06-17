import { useState, useContext } from 'react'
import axios from 'axios'
import { useForm } from 'react-hook-form'
import { AuthContext } from './context/AuthProvider.jsx'

function CreateRoom({ onRoomCreated }) {
    const { authState } = useContext(AuthContext)
    const [showPassword, setShowPassword] = useState(false)
    const [message, setMessage] = useState('')
    const { register, handleSubmit, reset, formState: { errors } } = useForm()

    const onSubmit = async (data) => {
        try {
            const response = await axios.post(
                'http://localhost:5000/api/rooms/create',
                {
                    room_name: data.room_name,
                    password: showPassword ? data.password : ''
                },
                {
                    headers: {
                        Authorization: `Bearer ${authState.token}`
                    }
                }
            )

            onRoomCreated({
                ...response.data,
                password: showPassword ? data.password : null
            })
            reset()
        } catch (error) {
            setMessage(error.response?.data?.msg || 'Unable to create room')
        }
    }

    return (
        <div style={{ maxWidth: '500px', margin: '2rem auto' }}>
            <h2>Create Room</h2>
            <form onSubmit={handleSubmit(onSubmit)}>
                <div style={{ marginBottom: '1rem' }}>
                    <label>Room Name</label>
                    <input
                        type="text"
                        {...register('room_name', { required: 'Room name is required' })}
                        style={{ width: '100%', padding: '0.5rem' }}
                    />
                    {errors.room_name && <p style={{ color: 'red' }}>{errors.room_name.message}</p>}
                </div>

                <div style={{ marginBottom: '1rem' }}>
                    <label>
                        <input
                            type="checkbox"
                            checked={showPassword}
                            onChange={(e) => setShowPassword(e.target.checked)}
                        />
                        {' '}Use password
                    </label>
                </div>

                {showPassword && (
                    <div style={{ marginBottom: '1rem' }}>
                        <label>Password</label>
                        <input
                            type="password"
                            {...register('password')}
                            style={{ width: '100%', padding: '0.5rem' }}
                        />
                    </div>
                )}

                <button type="submit">Create Room</button>
            </form>

            {message && <p style={{ marginTop: '1rem', color: 'red' }}>{message}</p>}
        </div>
    )
}

export default CreateRoom