# RSVP Management App

A comprehensive RSVP management application that allows hosts to create events, generate QR codes for physical invites, and manage guest responses with Google Drive integration.

## Features

- 📱 **QR Code Invites**: Generate unique QR codes for physical invites
- ☁️ **Google Drive Integration**: Secure storage of all event data and RSVP responses
- 📊 **Management Dashboard**: Track responses, manage guest lists, and export data
- 📱 **Mobile-Optimized**: Responsive design for QR code scanning on mobile devices
- 🔐 **Secure Authentication**: Google OAuth for host access

## Quick Start

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Set up Environment Variables**
   ```bash
   cp env.example .env
   ```
   Edit `.env` with your Google Drive API credentials.

3. **Start the Application**
   ```bash
   npm start
   ```
   For development with auto-reload:
   ```bash
   npm run dev
   ```

4. **Access the App**
   Open your browser to `http://localhost:3000`

## Project Structure

```
rsvp-management-app/
├── public/                 # Frontend files
│   ├── css/               # Stylesheets
│   ├── js/                # JavaScript files
│   └── images/            # Static images
├── server.js              # Main server file
├── package.json           # Dependencies and scripts
└── README.md             # This file
```

## API Endpoints

- `GET /` - Main application interface
- `GET /health` - Health check endpoint

## Development Status

🚧 **Currently in Development**

- ✅ Project structure initialized
- ✅ Basic server setup
- ✅ Frontend interface
- ⏳ Google Drive API integration
- ⏳ QR code generation
- ⏳ RSVP form functionality
- ⏳ Host management dashboard

## Next Steps

1. Set up Google Drive API credentials
2. Implement QR code generation
3. Build RSVP form interface
4. Create host management dashboard
5. Add authentication system

## Contributing

This is a development project. Please follow the established patterns and test thoroughly before submitting changes.

## License

MIT License - see LICENSE file for details.




