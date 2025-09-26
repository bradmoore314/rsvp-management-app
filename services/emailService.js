const nodemailer = require('nodemailer');

class EmailService {
    constructor() {
        this.transporter = null;
        this.initialized = false;
    }

    /**
     * Initialize email service
     */
    async initialize() {
        try {
            // For now, we'll use a simple SMTP configuration
            // In production, you'd want to use a service like SendGrid, Mailgun, or AWS SES
            this.transporter = nodemailer.createTransporter({
                host: process.env.SMTP_HOST || 'smtp.gmail.com',
                port: process.env.SMTP_PORT || 587,
                secure: false, // true for 465, false for other ports
                auth: {
                    user: process.env.SMTP_USER || process.env.GOOGLE_CLIENT_ID,
                    pass: process.env.SMTP_PASS || process.env.GOOGLE_CLIENT_SECRET
                }
            });

            // Verify connection configuration
            await this.transporter.verify();
            this.initialized = true;
            console.log('✅ Email service initialized successfully');
        } catch (error) {
            console.log('⚠️ Email service initialization failed:', error.message);
            console.log('📧 Email notifications will be disabled');
            this.initialized = false;
        }
    }

    /**
     * Send RSVP notification email
     */
    async sendRSVPNotification(rsvpData, eventData, hostEmail) {
        if (!this.initialized) {
            console.log('⚠️ Email service not initialized, skipping notification');
            return false;
        }

        try {
            const subject = `New RSVP for "${eventData.name}"`;
            const html = this.generateRSVPEmailHTML(rsvpData, eventData);
            const text = this.generateRSVPEmailText(rsvpData, eventData);

            const mailOptions = {
                from: `"Yes or No Invites" <${process.env.SMTP_FROM || 'noreply@yesorno-invites.com'}>`,
                to: hostEmail,
                subject: subject,
                text: text,
                html: html
            };

            const result = await this.transporter.sendMail(mailOptions);
            console.log(`✅ RSVP notification sent to ${hostEmail}:`, result.messageId);
            return true;
        } catch (error) {
            console.error('❌ Failed to send RSVP notification:', error.message);
            return false;
        }
    }

    /**
     * Generate HTML email content
     */
    generateRSVPEmailHTML(rsvpData, eventData) {
        const attendanceEmoji = {
            'yes': '✅',
            'no': '❌',
            'maybe': '❓'
        };

        const attendanceText = {
            'yes': 'Yes, I\'ll be there!',
            'no': 'Sorry, I can\'t make it',
            'maybe': 'Maybe, I\'ll let you know'
        };

        return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center; }
                .content { background: #f7fafc; padding: 20px; border-radius: 0 0 8px 8px; }
                .rsvp-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
                .detail-row { display: flex; justify-content: space-between; margin: 10px 0; padding: 8px 0; border-bottom: 1px solid #e2e8f0; }
                .detail-label { font-weight: bold; color: #4a5568; }
                .detail-value { color: #2d3748; }
                .attendance-badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-weight: bold; }
                .attendance-yes { background: #c6f6d5; color: #22543d; }
                .attendance-no { background: #fed7d7; color: #742a2a; }
                .attendance-maybe { background: #fef5e7; color: #744210; }
                .footer { text-align: center; margin-top: 20px; color: #718096; font-size: 14px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>✨ Yes or No Invites</h1>
                    <h2>New RSVP Received!</h2>
                </div>
                <div class="content">
                    <div class="rsvp-details">
                        <h3>Event Details</h3>
                        <div class="detail-row">
                            <span class="detail-label">Event:</span>
                            <span class="detail-value">${eventData.name}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Date:</span>
                            <span class="detail-value">${new Date(eventData.date).toLocaleDateString()}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Time:</span>
                            <span class="detail-value">${eventData.time}${eventData.endTime ? ` - ${eventData.endTime}` : ''}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Location:</span>
                            <span class="detail-value">${eventData.location}</span>
                        </div>
                    </div>

                    <div class="rsvp-details">
                        <h3>Guest Information</h3>
                        <div class="detail-row">
                            <span class="detail-label">Name:</span>
                            <span class="detail-value">${rsvpData.guestName}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Email:</span>
                            <span class="detail-value">${rsvpData.guestEmail}</span>
                        </div>
                        ${rsvpData.guestPhone ? `
                        <div class="detail-row">
                            <span class="detail-label">Phone:</span>
                            <span class="detail-value">${rsvpData.guestPhone}</span>
                        </div>
                        ` : ''}
                        ${rsvpData.emergencyContact ? `
                        <div class="detail-row">
                            <span class="detail-label">Emergency Contact:</span>
                            <span class="detail-value">${rsvpData.emergencyContact}</span>
                        </div>
                        ` : ''}
                        <div class="detail-row">
                            <span class="detail-label">Attendance:</span>
                            <span class="detail-value">
                                <span class="attendance-badge attendance-${rsvpData.attendance}">
                                    ${attendanceEmoji[rsvpData.attendance]} ${attendanceText[rsvpData.attendance]}
                                </span>
                            </span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Guest Count:</span>
                            <span class="detail-value">${rsvpData.guestCount} ${rsvpData.guestCount === 1 ? 'person' : 'people'}</span>
                        </div>
                        ${rsvpData.dietaryRestrictions ? `
                        <div class="detail-row">
                            <span class="detail-label">Dietary Restrictions:</span>
                            <span class="detail-value">${rsvpData.dietaryRestrictions}</span>
                        </div>
                        ` : ''}
                        ${rsvpData.message ? `
                        <div class="detail-row">
                            <span class="detail-label">Message:</span>
                            <span class="detail-value">${rsvpData.message}</span>
                        </div>
                        ` : ''}
                        <div class="detail-row">
                            <span class="detail-label">Submitted:</span>
                            <span class="detail-value">${new Date(rsvpData.submittedAt).toLocaleString()}</span>
                        </div>
                    </div>
                </div>
                <div class="footer">
                    <p>This notification was sent from Yes or No Invites</p>
                    <p>You can manage your notification settings in your dashboard</p>
                </div>
            </div>
        </body>
        </html>
        `;
    }

    /**
     * Generate plain text email content
     */
    generateRSVPEmailText(rsvpData, eventData) {
        const attendanceText = {
            'yes': 'Yes, I\'ll be there!',
            'no': 'Sorry, I can\'t make it',
            'maybe': 'Maybe, I\'ll let you know'
        };

        return `
New RSVP Received!

Event: ${eventData.name}
Date: ${new Date(eventData.date).toLocaleDateString()}
Time: ${eventData.time}${eventData.endTime ? ` - ${eventData.endTime}` : ''}
Location: ${eventData.location}

Guest Information:
Name: ${rsvpData.guestName}
Email: ${rsvpData.guestEmail}
${rsvpData.guestPhone ? `Phone: ${rsvpData.guestPhone}` : ''}
${rsvpData.emergencyContact ? `Emergency Contact: ${rsvpData.emergencyContact}` : ''}
Attendance: ${attendanceText[rsvpData.attendance]}
Guest Count: ${rsvpData.guestCount} ${rsvpData.guestCount === 1 ? 'person' : 'people'}
${rsvpData.dietaryRestrictions ? `Dietary Restrictions: ${rsvpData.dietaryRestrictions}` : ''}
${rsvpData.message ? `Message: ${rsvpData.message}` : ''}
Submitted: ${new Date(rsvpData.submittedAt).toLocaleString()}

This notification was sent from Yes or No Invites
        `.trim();
    }

    /**
     * Check if email service is ready
     */
    isReady() {
        return this.initialized && this.transporter;
    }
}

module.exports = EmailService;
