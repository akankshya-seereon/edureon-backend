const NotificationModel = require('../models/notificationModel');

exports.getNotifications = async (req, res) => {
  try {
    const notifications = await NotificationModel.getAll(req.user.code);
    res.json({ success: true, notifications });
  } catch (err) {
    console.error("SQL ERROR in getNotifications:", err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

exports.createNotification = async (req, res) => {
  try {
    const payload = {
      institute_code: req.user.code,
      course: req.body.course,
      title: req.body.title,
      message: req.body.message,
      targetRoles: req.body.targetRoles,
      channels: req.body.channels,
      scheduleDate: req.body.scheduleDate || null,
      scheduleTime: req.body.scheduleTime || null,
      status: req.body.status || 'delivered'
    };

    const id = await NotificationModel.create(payload);
    res.status(201).json({ success: true, id });
  } catch (err) {
    console.error("SQL ERROR in createNotification:", err);
    res.status(500).json({ success: false, message: "Failed to create notification" });
  }
};