import { useState, useContext } from 'react'
import api from './api/axiosInstance.js'
import { useForm } from 'react-hook-form'
import { AuthContext } from './context/AuthProvider.jsx'

function CreateRoom({ onRoomCreated }) {
    const { authState } = useContext(AuthContext)
    const [showPassword, setShowPassword] = useState(false)
    const [message, setMessage] = useState('')
    const { register, handleSubmit, reset, formState: { errors } } = useForm()

    const onSubmit = async (data) => {
        try {
            const response = await api.post(
                '/api/rooms/create',
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
        <div className="form-panel">
            <h2 className="app-heading">Create Room</h2>
            <form onSubmit={handleSubmit(onSubmit)}>
                <div className="form-row">
                    <label className="app-label">Room Name</label>
                    <input
                        type="text"
                        {...register('room_name', { required: 'Room name is required' })}
                        className="text-input"
                    />
                    {errors.room_name && <p className="error-text">{errors.room_name.message}</p>}
                </div>

                <div className="form-row checkbox-row">
                    <label className="checkbox-label">
                        <input
                            type="checkbox"
                            checked={showPassword}
                            onChange={(e) => setShowPassword(e.target.checked)}
                        />
                        <span>Use password</span>
                    </label>
                </div>

                {showPassword && (
                    <div className="form-row">
                        <label className="app-label">Password</label>
                        <input
                            type="password"
                            {...register('password')}
                            className="text-input"
                        />
                    </div>
                )}

                <div className="button-row">
                    <button className="app-button app-button--primary" type="submit">
                        Create Room
                    </button>
                </div>
            </form>

            {message && <p className="error-text" style={{ marginTop: '1rem' }}>{message}</p>}
        </div>
    )
}

export default CreateRoom