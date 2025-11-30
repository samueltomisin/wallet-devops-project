const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3003;

app.use(cors());
app.use(express.json());

// Store notifications in memory (Week 2: move to database)
const notifications = [];

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'notification-service' });
});

// Send notification
app.post('/send', (req, res) => {
  const { userId, message, type } = req.body;

  const notification = {
    id: `NOTIF${Date.now()}`,
    userId,
    message,
    type,
    timestamp: new Date().toISOString(),
    sent: true
  };

  notifications.push(notification);

  console.log(`[NOTIFICATION] 📧 Sent to ${userId}: ${message}`);

  // Simulate sending (email/SMS would go here in production)
  res.json({
    success: true,
    notificationId: notification.id,
    message: 'Notification sent'
  });
});

// Get notification history for user
app.get('/history/:userId', (req, res) => {
  const { userId } = req.params;
  const userNotifications = notifications.filter(n => n.userId === userId);

  res.json({
    userId,
    notifications: userNotifications
  });
});

// Get all notifications (for debugging)
app.get('/all', (req, res) => {
  res.json({ notifications });
});

app.listen(PORT, () => {
  console.log(`✅ Notification Service running on port ${PORT}`);
});