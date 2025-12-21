const express = require('express');
const app = express();
const PORT = process.env.PORT || 3003;

// Middleware
app.use(express.json());

// Store notifications in memory (for demo)
const notifications = [];

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    service: 'notification-service',
    timestamp: new Date().toISOString()
  });
});

// Send notification
app.post('/notify', (req, res) => {
  const { userId, message, type } = req.body;

  // Validation
  if (!userId || !message) {
    return res.status(400).json({
      success: false,
      message: 'Missing required fields: userId, message'
    });
  }

  const notification = {
    id: Date.now(),
    userId,
    message,
    type: type || 'general',
    timestamp: new Date().toISOString(),
    read: false
  };

  notifications.push(notification);

  console.log(`[NOTIFICATION] 📧 Sent to user ${userId}: ${message}`);

  res.json({ 
    success: true, 
    notification 
  });
});

// Get notifications for a user
app.get('/notifications/:userId', (req, res) => {
  const { userId } = req.params;
  const userNotifications = notifications.filter(n => n.userId === userId);

  console.log(`[NOTIFICATION] Fetching ${userNotifications.length} notifications for ${userId}`);

  res.json({ 
    userId,
    count: userNotifications.length,
    notifications: userNotifications 
  });
});

// Get all notifications (for debugging)
app.get('/notifications', (req, res) => {
  console.log(`[NOTIFICATION] Fetching all notifications: ${notifications.length} total`);
  
  res.json({
    total: notifications.length,
    notifications
  });
});

// Mark notification as read
app.patch('/notifications/:notificationId/read', (req, res) => {
  const { notificationId } = req.params;
  const notification = notifications.find(n => n.id === parseInt(notificationId));

  if (!notification) {
    return res.status(404).json({
      success: false,
      message: 'Notification not found'
    });
  }

  notification.read = true;
  console.log(`[NOTIFICATION] ✅ Marked notification ${notificationId} as read`);

  res.json({
    success: true,
    notification
  });
});

// Delete notification
app.delete('/notifications/:notificationId', (req, res) => {
  const { notificationId } = req.params;
  const index = notifications.findIndex(n => n.id === parseInt(notificationId));

  if (index === -1) {
    return res.status(404).json({
      success: false,
      message: 'Notification not found'
    });
  }

  const deleted = notifications.splice(index, 1)[0];
  console.log(`[NOTIFICATION] 🗑️ Deleted notification ${notificationId}`);

  res.json({
    success: true,
    deleted
  });
});

// Clear all notifications for a user
app.delete('/notifications/user/:userId', (req, res) => {
  const { userId } = req.params;
  const initialLength = notifications.length;
  
  const remaining = notifications.filter(n => n.userId !== userId);
  const deletedCount = initialLength - remaining.length;
  
  notifications.length = 0;
  notifications.push(...remaining);

  console.log(`[NOTIFICATION] 🗑️ Cleared ${deletedCount} notifications for user ${userId}`);

  res.json({
    success: true,
    deletedCount
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Notification Service running on port ${PORT}`);
  console.log(`🔔 Ready to send notifications`);
});