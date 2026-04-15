// src/faculty/controllers/notificationController.js
const db = require('../../config/db');

exports.getNotifications = async (req, res) => {
  try {
    const facultyId = req.user.id; // Comes from your auth middleware

    // Fetch alerts specifically for this faculty member, newest first
    const [notifications] = await db.query(
      `SELECT * FROM notifications 
       WHERE user_id = ? 
       ORDER BY created_at DESC 
       LIMIT 50`,
      [facultyId]
    );

    res.status(200).json({ success: true, notifications });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ success: false, message: "Failed to fetch notifications" });
  }
};

exports.markAsRead = async (req, res) => {
  try {
    const notificationId = req.params.id;
    const facultyId = req.user.id;

    // Update status to 'read' (based on your 'status' column from DESC)
    await db.query(
      `UPDATE notifications SET status = 'read' WHERE id = ? AND user_id = ?`,
      [notificationId, facultyId]
    );

    res.status(200).json({ success: true, message: "Marked as read" });
  } catch (error) {
    console.error("Error updating notification:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.markAllAsRead = async (req, res) => {
  try {
    const facultyId = req.user.id;

    await db.query(
      `UPDATE notifications SET status = 'read' WHERE user_id = ? AND status != 'read'`,
      [facultyId]
    );

    res.status(200).json({ success: true, message: "All marked as read" });
  } catch (error) {
    console.error("Error updating notifications:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};