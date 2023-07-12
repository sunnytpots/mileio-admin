import io from 'socket.io-client'
const socket = io(`${process.env.NUXT_ENV_API_URL}`)
// const socket = io('http://localhost:3001')

export default socket
