
// import { Client } from '@stomp/stompjs';

// let stompClient = null;

// const notificationWebSocket = {
//   connect(userId, onNotification, onMessage) {
//     if (!userId) {
//       console.error(
//         'Cannot connect notification WebSocket: userId is missing'
//       );
//       return;
//     }

//     // Reuse the existing connection if it is already active.
//     if (stompClient && stompClient.active) {
//       return; 
//     }

//     stompClient = new Client({
//       brokerURL: 'ws://localhost:8080/ws',

//       connectHeaders: {
//         Authorization: `Bearer ${localStorage.getItem('token')}`,
//       },

//       reconnectDelay: 5000,

//       onConnect: () => {
//         console.log('Notification WebSocket connected');

//         // Existing notification subscription.
//         stompClient.subscribe(
//           `/topic/notifications/${userId}`,
//           (message) => {
//             try {
//               const notification = JSON.parse(message.body);

//               console.log('New realtime notification:', notification);

//               if (onNotification) {
//                 onNotification(notification);
//               }
//             } catch (error) {
//               console.error(
//                 'Failed to parse notification:',
//                 error
//               );
//             }
//           }
//         );

//         // New message subscription.
//         stompClient.subscribe(
//           `/topic/messages/${userId}`,
//           (message) => {
//             try {
//               const event = JSON.parse(message.body);

//               console.log('New realtime message event:', event);

//               if (onMessage) {
//                 onMessage(event);
//               }
//             } catch (error) {
//               console.error(
//                 'Failed to parse message event:',
//                 error
//               );
//             }
//           }
//         );
//       },

//       onStompError: (frame) => {
//         console.error(
//           'Notification WebSocket STOMP error:',
//           frame
//         );
//       },

//       onWebSocketError: (error) => {
//         console.error(
//           'Notification WebSocket error:',
//           error
//         );
//       },
//     });

//     stompClient.activate();
//   },

//   disconnect() {
//     if (stompClient) {
//       stompClient.deactivate();
//       stompClient = null;

//       console.log('Notification WebSocket disconnected');
//     }
//   },
// };

// export default notificationWebSocket;
