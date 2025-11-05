import SockJS from 'sockjs-client'
import Stomp from 'stompjs'

let stompClient = null
let subscribers = []

export const connectWebSocket = () => {
  return new Promise((resolve, reject) => {
    const socket = new SockJS('http://localhost:8080/ws')
    stompClient = Stomp.over(socket)
    
    // 禁用控制台日志
    stompClient.debug = null
    
    stompClient.connect(
      {},
      (frame) => {
        console.log('WebSocket 连接成功')
        resolve(stompClient)
      },
      (error) => {
        console.error('WebSocket 连接失败:', error)
        reject(error)
      }
    )
  })
}

export const subscribeToStatus = (callback) => {
  if (stompClient && stompClient.connected) {
    const subscription = stompClient.subscribe('/topic/workflow-status', (message) => {
      const data = JSON.parse(message.body)
      callback(data)
    })
    subscribers.push(subscription)
    return subscription
  }
}

export const disconnectWebSocket = () => {
  subscribers.forEach(sub => sub.unsubscribe())
  subscribers = []
  if (stompClient) {
    stompClient.disconnect()
    console.log('WebSocket 断开连接')
  }
}

