// Gemini AI Service for Invitation Generation
const { GoogleGenerativeAI } = require('@google/generative-ai');

class GeminiService {
    constructor() {
        this.apiKey = 'AIzaSyA3XZahYa4RfcPtpTIRaHK9NcETe7AAe8s';
        this.genAI = new GoogleGenerativeAI(this.apiKey);
        this.model = this.genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    }

    // Generate invitation content using Gemini AI
    async generateInvitationContent(eventData) {
        try {
            const {
                eventType,
                eventName,
                eventDate,
                eventTime,
                eventLocation,
                hostName,
                customPrompt = '',
                theme
            } = eventData;

            const prompt = this.buildInvitationPrompt(eventData);
            
            const result = await this.model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();

            return this.parseAIResponse(text);
        } catch (error) {
            console.error('Error generating invitation content with Gemini:', error);
            return this.getFallbackContent(eventData);
        }
    }

    // Build comprehensive prompt for Gemini
    buildInvitationPrompt(eventData) {
        const {
            eventType,
            eventName,
            eventDate,
            eventTime,
            eventLocation,
            hostName,
            customPrompt,
            theme
        } = eventData;

        const themeDescriptions = {
            birthday: 'fun, colorful, playful, and celebratory',
            wedding: 'elegant, romantic, sophisticated, and formal',
            corporate: 'professional, clean, modern, and business-focused',
            holiday: 'festive, cheerful, seasonal, and warm',
            casual: 'relaxed, friendly, informal, and welcoming'
        };

        const themeDesc = themeDescriptions[eventType] || 'beautiful and engaging';

        return `
You are a professional invitation designer and copywriter. Create a stunning invitation for the following event:

EVENT DETAILS:
- Event Type: ${eventType}
- Event Name: ${eventName}
- Date: ${eventDate}
- Time: ${eventTime}
- Location: ${eventLocation}
- Host: ${hostName}
- Theme Style: ${themeDesc}
${customPrompt ? `- Custom Requirements: ${customPrompt}` : ''}

Please generate the following components for this invitation:

1. MAIN TITLE: A creative, engaging title for the invitation (not just the event name)
2. SUBTITLE: A catchy subtitle that captures the event's essence
3. INVITATION MESSAGE: A warm, inviting message (2-3 sentences)
4. RSVP MESSAGE: A friendly RSVP request message
5. DRESS CODE: Appropriate attire suggestion (if applicable)
6. SPECIAL INSTRUCTIONS: Any special notes or instructions
7. HASHTAG: A fun, relevant hashtag for social media
8. EMOJI SET: 3-5 relevant emojis that match the theme

Format your response as JSON with these exact keys:
{
  "mainTitle": "string",
  "subtitle": "string", 
  "invitationMessage": "string",
  "rsvpMessage": "string",
  "dressCode": "string",
  "specialInstructions": "string",
  "hashtag": "string",
  "emojiSet": ["emoji1", "emoji2", "emoji3", "emoji4", "emoji5"]
}

Make the content ${themeDesc} and appropriate for a ${eventType} event. Be creative, engaging, and professional.
        `.trim();
    }

    // Parse AI response and extract structured data
    parseAIResponse(text) {
        try {
            // Try to extract JSON from the response
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const jsonStr = jsonMatch[0];
                return JSON.parse(jsonStr);
            }
            
            // If no JSON found, create structured response from text
            return this.createStructuredResponse(text);
        } catch (error) {
            console.error('Error parsing AI response:', error);
            return this.createStructuredResponse(text);
        }
    }

    // Create structured response from unstructured text
    createStructuredResponse(text) {
        const lines = text.split('\n').filter(line => line.trim());
        
        return {
            mainTitle: this.extractValue(lines, 'title', 'main title') || 'You\'re Invited!',
            subtitle: this.extractValue(lines, 'subtitle') || 'Join us for a special celebration',
            invitationMessage: this.extractValue(lines, 'message', 'invitation') || 'We would love for you to join us for this special occasion.',
            rsvpMessage: this.extractValue(lines, 'rsvp') || 'Please RSVP to let us know you\'re coming!',
            dressCode: this.extractValue(lines, 'dress', 'attire') || 'Casual attire',
            specialInstructions: this.extractValue(lines, 'instructions', 'notes') || 'Please bring your smile and positive energy!',
            hashtag: this.extractValue(lines, 'hashtag') || '#Celebration',
            emojiSet: this.extractEmojis(text) || ['🎉', '✨', '🎊', '🥳', '🎈']
        };
    }

    // Extract value from lines based on keywords
    extractValue(lines, ...keywords) {
        for (const line of lines) {
            for (const keyword of keywords) {
                if (line.toLowerCase().includes(keyword.toLowerCase())) {
                    return line.replace(new RegExp(`.*${keyword}.*:?\\s*`, 'i'), '').trim();
                }
            }
        }
        return null;
    }

    // Extract emojis from text
    extractEmojis(text) {
        const emojiRegex = /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu;
        const emojis = text.match(emojiRegex);
        return emojis ? emojis.slice(0, 5) : null;
    }

    // Generate theme-specific design suggestions
    async generateDesignSuggestions(eventType, customPrompt = '') {
        try {
            const prompt = `
You are a professional graphic designer. Generate design suggestions for a ${eventType} invitation.

${customPrompt ? `Custom requirements: ${customPrompt}` : ''}

Provide suggestions for:
1. Color palette (3-5 colors with hex codes)
2. Typography style (2-3 font suggestions)
3. Layout style (modern, classic, playful, etc.)
4. Visual elements (icons, patterns, decorations)
5. Overall mood/feeling

Format as JSON:
{
  "colorPalette": ["#hex1", "#hex2", "#hex3"],
  "typography": ["font1", "font2", "font3"],
  "layoutStyle": "string",
  "visualElements": ["element1", "element2", "element3"],
  "mood": "string"
}
            `.trim();

            const result = await this.model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();

            return this.parseDesignResponse(text);
        } catch (error) {
            console.error('Error generating design suggestions:', error);
            return this.getFallbackDesign(eventType);
        }
    }

    // Parse design response
    parseDesignResponse(text) {
        try {
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
        } catch (error) {
            console.error('Error parsing design response:', error);
        }
        
        return this.getFallbackDesign('casual');
    }

    // Generate personalized messages for different guest types
    async generatePersonalizedMessages(eventType, guestTypes = []) {
        try {
            const prompt = `
Generate personalized invitation messages for different types of guests at a ${eventType} event.

Guest types: ${guestTypes.join(', ') || 'family, friends, colleagues'}

Create warm, personalized messages that make each guest type feel special and excited to attend.

Format as JSON:
{
  "family": "message for family members",
  "friends": "message for friends", 
  "colleagues": "message for colleagues",
  "general": "general message for all guests"
}
            `.trim();

            const result = await this.model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();

            return this.parsePersonalizedResponse(text);
        } catch (error) {
            console.error('Error generating personalized messages:', error);
            return this.getFallbackPersonalized(eventType);
        }
    }

    // Parse personalized response
    parsePersonalizedResponse(text) {
        try {
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
        } catch (error) {
            console.error('Error parsing personalized response:', error);
        }
        
        return this.getFallbackPersonalized('casual');
    }

    // Fallback content when AI fails
    getFallbackContent(eventData) {
        const { eventType, eventName, hostName } = eventData;
        
        const fallbacks = {
            birthday: {
                mainTitle: 'Birthday Celebration!',
                subtitle: 'Join us for cake, laughter, and good times',
                invitationMessage: `You're invited to celebrate ${eventName}! We can't wait to share this special day with you.`,
                rsvpMessage: 'Please let us know if you can make it to the party!',
                dressCode: 'Casual and comfortable',
                specialInstructions: 'Bring your dancing shoes and party spirit!',
                hashtag: '#BirthdayBash',
                emojiSet: ['🎂', '🎉', '🎈', '🥳', '✨']
            },
            wedding: {
                mainTitle: 'Wedding Celebration',
                subtitle: 'Two hearts, one love, and you\'re invited',
                invitationMessage: `Join us as we celebrate our union and begin our journey together.`,
                rsvpMessage: 'Please RSVP to help us plan our special day.',
                dressCode: 'Semi-formal attire',
                specialInstructions: 'Please arrive 15 minutes early for the ceremony.',
                hashtag: '#WeddingDay',
                emojiSet: ['💒', '💕', '👰', '🤵', '💐']
            },
            corporate: {
                mainTitle: 'Corporate Event',
                subtitle: 'Networking, celebration, and professional growth',
                invitationMessage: `Join us for an evening of networking and celebration.`,
                rsvpMessage: 'Please confirm your attendance for planning purposes.',
                dressCode: 'Business casual',
                specialInstructions: 'Business cards recommended for networking.',
                hashtag: '#CorporateEvent',
                emojiSet: ['🏢', '🤝', '📈', '💼', '🎯']
            },
            holiday: {
                mainTitle: 'Holiday Celebration',
                subtitle: 'Festive fun and holiday cheer await!',
                invitationMessage: `Join us for a magical holiday celebration filled with joy and laughter.`,
                rsvpMessage: 'Please RSVP to help us prepare for the festivities!',
                dressCode: 'Festive attire encouraged',
                specialInstructions: 'Bring your holiday spirit and appetite for fun!',
                hashtag: '#HolidayParty',
                emojiSet: ['🎄', '❄️', '🎁', '🦌', '🌟']
            },
            casual: {
                mainTitle: 'Casual Gathering',
                subtitle: 'Good times, good friends, good vibes',
                invitationMessage: `Come hang out and make some memories with us!`,
                rsvpMessage: 'Let us know if you can make it!',
                dressCode: 'Come as you are',
                specialInstructions: 'Just bring yourself and a positive attitude!',
                hashtag: '#GoodTimes',
                emojiSet: ['🎉', '😊', '🍕', '🎵', '⭐']
            }
        };

        return fallbacks[eventType] || fallbacks.casual;
    }

    // Fallback design when AI fails
    getFallbackDesign(eventType) {
        const designs = {
            birthday: {
                colorPalette: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57'],
                typography: ['Comic Sans MS', 'Fredoka One', 'Nunito'],
                layoutStyle: 'playful and colorful',
                visualElements: ['balloons', 'confetti', 'party hats', 'streamers'],
                mood: 'fun and energetic'
            },
            wedding: {
                colorPalette: ['#F7E7CE', '#D4AF37', '#8B4513', '#F5F5DC', '#DEB887'],
                typography: ['Playfair Display', 'Great Vibes', 'Dancing Script'],
                layoutStyle: 'elegant and romantic',
                visualElements: ['roses', 'hearts', 'rings', 'lace'],
                mood: 'romantic and sophisticated'
            },
            corporate: {
                colorPalette: ['#2C3E50', '#34495E', '#7F8C8D', '#BDC3C7', '#ECF0F1'],
                typography: ['Roboto', 'Open Sans', 'Lato'],
                layoutStyle: 'clean and professional',
                visualElements: ['geometric shapes', 'minimal icons', 'clean lines'],
                mood: 'professional and modern'
            },
            holiday: {
                colorPalette: ['#E74C3C', '#F39C12', '#27AE60', '#8E44AD', '#F1C40F'],
                typography: ['Merriweather', 'Oswald', 'Montserrat'],
                layoutStyle: 'festive and warm',
                visualElements: ['snowflakes', 'ornaments', 'lights', 'gifts'],
                mood: 'festive and cheerful'
            },
            casual: {
                colorPalette: ['#3498DB', '#2ECC71', '#F39C12', '#E67E22', '#9B59B6'],
                typography: ['Source Sans Pro', 'PT Sans', 'Ubuntu'],
                layoutStyle: 'relaxed and friendly',
                visualElements: ['organic shapes', 'soft curves', 'natural elements'],
                mood: 'relaxed and welcoming'
            }
        };

        return designs[eventType] || designs.casual;
    }

    // Fallback personalized messages
    getFallbackPersonalized(eventType) {
        return {
            family: 'We can\'t wait to celebrate with our amazing family!',
            friends: 'Good times ahead with our favorite people!',
            colleagues: 'Looking forward to celebrating with our professional network!',
            general: 'Your presence would make this event even more special!'
        };
    }

    // Test Gemini connection
    async testConnection() {
        try {
            const result = await this.model.generateContent('Hello, are you working?');
            const response = await result.response;
            return { success: true, message: 'Gemini AI is connected and working!' };
        } catch (error) {
            console.error('Gemini connection test failed:', error);
            return { success: false, error: error.message };
        }
    }
}

module.exports = GeminiService;
