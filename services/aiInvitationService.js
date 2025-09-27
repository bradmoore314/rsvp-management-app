// AI-Powered Invitation Generation Service
const GeminiService = require('./geminiService');

class AIInvitationService {
    constructor() {
        this.geminiService = new GeminiService();
        this.themes = {
            birthday: {
                name: 'Birthday Celebration',
                styles: ['fun', 'colorful', 'playful', 'party'],
                colors: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4'],
                fonts: ['Comic Sans MS', 'Fredoka One', 'Nunito']
            },
            wedding: {
                name: 'Wedding Celebration',
                styles: ['elegant', 'romantic', 'classic', 'sophisticated'],
                colors: ['#F7E7CE', '#D4AF37', '#8B4513', '#F5F5DC'],
                fonts: ['Playfair Display', 'Great Vibes', 'Dancing Script']
            },
            corporate: {
                name: 'Corporate Event',
                styles: ['professional', 'clean', 'modern', 'business'],
                colors: ['#2C3E50', '#34495E', '#7F8C8D', '#BDC3C7'],
                fonts: ['Roboto', 'Open Sans', 'Lato']
            },
            holiday: {
                name: 'Holiday Party',
                styles: ['festive', 'cheerful', 'seasonal', 'warm'],
                colors: ['#E74C3C', '#F39C12', '#27AE60', '#8E44AD'],
                fonts: ['Merriweather', 'Oswald', 'Montserrat']
            },
            casual: {
                name: 'Casual Gathering',
                styles: ['relaxed', 'friendly', 'informal', 'cozy'],
                colors: ['#3498DB', '#2ECC71', '#F39C12', '#E67E22'],
                fonts: ['Source Sans Pro', 'PT Sans', 'Ubuntu']
            }
        };
    }

    // Generate AI prompt for invitation design
    generateInvitationPrompt(eventType, customPrompt = '', userPhotos = []) {
        const theme = this.themes[eventType] || this.themes.casual;
        
        let basePrompt = `Create a beautiful, professional invitation design for a ${theme.name.toLowerCase()}. `;
        
        if (customPrompt) {
            basePrompt += `Custom requirements: ${customPrompt}. `;
        }
        
        basePrompt += `Style should be ${theme.styles.join(', ')}. `;
        basePrompt += `Use colors from this palette: ${theme.colors.join(', ')}. `;
        basePrompt += `Design should be suitable for A4 double-sided printing with high quality. `;
        basePrompt += `Include space for QR code integration. `;
        basePrompt += `Make it look like a premium, professional invitation that people would be excited to receive. `;
        
        if (userPhotos.length > 0) {
            basePrompt += `Incorporate ${userPhotos.length} user photos into the design layout. `;
        }
        
        return basePrompt;
    }

    // Generate invitation using Gemini AI
    async generateInvitation(eventData) {
        try {
            const {
                eventType,
                eventName,
                eventDate,
                eventTime,
                eventLocation,
                hostName,
                customPrompt,
                userPhotos = [],
                theme = 'auto'
            } = eventData;

            // Generate AI content using Gemini
            const aiContent = await this.geminiService.generateInvitationContent(eventData);
            
            // Generate design suggestions using Gemini
            const designSuggestions = await this.geminiService.generateDesignSuggestions(eventType, customPrompt);
            
            // Create comprehensive invitation data
            const invitationData = {
                id: this.generateInvitationId(),
                eventType,
                theme: theme === 'auto' ? this.selectBestTheme(eventType) : theme,
                aiContent: aiContent,
                designSuggestions: designSuggestions,
                design: {
                    front: this.generateFrontDesign(eventData, designSuggestions),
                    back: this.generateBackDesign(eventData, designSuggestions),
                    qrCodePlacement: this.calculateQRCodePlacement(eventData)
                },
                content: {
                    title: eventName,
                    mainTitle: aiContent.mainTitle,
                    subtitle: aiContent.subtitle,
                    date: eventDate,
                    time: eventTime,
                    location: eventLocation,
                    host: hostName,
                    invitationMessage: aiContent.invitationMessage,
                    rsvpMessage: aiContent.rsvpMessage,
                    dressCode: aiContent.dressCode,
                    specialInstructions: aiContent.specialInstructions,
                    hashtag: aiContent.hashtag,
                    emojiSet: aiContent.emojiSet
                },
                photos: userPhotos,
                generatedAt: new Date().toISOString()
            };

            return invitationData;
        } catch (error) {
            console.error('Error generating invitation:', error);
            throw new Error('Failed to generate invitation');
        }
    }

    // Generate front design layout
    generateFrontDesign(eventData, designSuggestions = null) {
        const theme = this.themes[eventData.eventType] || this.themes.casual;
        
        // Use AI design suggestions if available
        const colors = designSuggestions?.colorPalette || theme.colors;
        const fonts = designSuggestions?.typography || theme.fonts;
        
        return {
            layout: designSuggestions?.layoutStyle || 'elegant',
            background: {
                type: 'gradient',
                colors: colors.slice(0, 2),
                pattern: 'subtle'
            },
            typography: {
                title: {
                    font: fonts[0],
                    size: '2.5rem',
                    weight: 'bold',
                    color: colors[0]
                },
                subtitle: {
                    font: fonts[1] || fonts[0],
                    size: '1.2rem',
                    weight: 'normal',
                    color: colors[1]
                }
            },
            elements: {
                decorative: true,
                borders: true,
                shadows: true,
                visualElements: designSuggestions?.visualElements || []
            }
        };
    }

    // Generate back design layout
    generateBackDesign(eventData) {
        return {
            layout: 'informational',
            background: {
                type: 'solid',
                color: '#FFFFFF'
            },
            sections: [
                {
                    type: 'event_details',
                    title: 'Event Details',
                    content: {
                        date: eventData.eventDate,
                        time: eventData.eventTime,
                        location: eventData.location
                    }
                },
                {
                    type: 'rsvp_section',
                    title: 'RSVP',
                    content: {
                        message: this.generateRSVPMessage(eventData.eventType),
                        qrCode: true
                    }
                },
                {
                    type: 'contact_info',
                    title: 'Contact',
                    content: {
                        host: eventData.hostName
                    }
                }
            ]
        };
    }

    // Calculate optimal QR code placement
    calculateQRCodePlacement(eventData) {
        return {
            position: 'bottom_right',
            size: 'medium',
            border: true,
            background: 'white'
        };
    }

    // Generate RSVP message based on event type
    generateRSVPMessage(eventType) {
        const messages = {
            birthday: "Scan the QR code to RSVP and let us know you're coming to celebrate!",
            wedding: "Please scan the QR code to RSVP and join us for our special day.",
            corporate: "Kindly scan the QR code to confirm your attendance.",
            holiday: "Scan the QR code to RSVP and join us for the festivities!",
            casual: "Scan the QR code to let us know if you can make it!"
        };
        
        return messages[eventType] || messages.casual;
    }

    // Select best theme based on event type
    selectBestTheme(eventType) {
        return this.themes[eventType] || this.themes.casual;
    }

    // Generate unique invitation ID
    generateInvitationId() {
        return 'inv_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    // Get available themes
    getAvailableThemes() {
        return Object.keys(this.themes).map(key => ({
            id: key,
            name: this.themes[key].name,
            styles: this.themes[key].styles,
            colors: this.themes[key].colors,
            fonts: this.themes[key].fonts
        }));
    }

    // Generate theme variations
    generateThemeVariations(baseTheme, count = 3) {
        const variations = [];
        const theme = this.themes[baseTheme] || this.themes.casual;
        
        for (let i = 0; i < count; i++) {
            variations.push({
                id: `${baseTheme}_variation_${i + 1}`,
                name: `${theme.name} - Variation ${i + 1}`,
                colors: this.shuffleArray([...theme.colors]),
                fonts: this.shuffleArray([...theme.fonts]),
                style: theme.styles[i % theme.styles.length]
            });
        }
        
        return variations;
    }

    // Utility function to shuffle array
    shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    // Generate AI suggestions for invitation content using Gemini
    async generateContentSuggestions(eventType, eventName) {
        try {
            // Use Gemini to generate personalized suggestions
            const personalizedMessages = await this.geminiService.generatePersonalizedMessages(eventType, ['family', 'friends', 'colleagues']);
            
            // Extract and format suggestions
            const suggestions = [
                personalizedMessages.family,
                personalizedMessages.friends,
                personalizedMessages.colleagues,
                personalizedMessages.general
            ].filter(Boolean);

            return suggestions.length > 0 ? suggestions : this.getFallbackSuggestions(eventType);
        } catch (error) {
            console.error('Error generating AI suggestions:', error);
            return this.getFallbackSuggestions(eventType);
        }
    }

    // Fallback suggestions when AI fails
    getFallbackSuggestions(eventType) {
        const suggestions = {
            birthday: [
                "Join us for cake, laughter, and celebration!",
                "It's party time! Come celebrate with us!",
                "Birthday bash alert! Your presence is the best gift!",
                "Let's make some birthday memories together!"
            ],
            wedding: [
                "Two hearts, one love, and you're invited to witness it all.",
                "Join us as we say 'I do' and celebrate our forever.",
                "Your presence would make our special day even more perfect.",
                "Come celebrate love, laughter, and happily ever after."
            ],
            corporate: [
                "Join us for an evening of networking and celebration.",
                "Your presence is requested at our annual company event.",
                "Come celebrate our achievements and look forward to the future.",
                "Join us for an evening of recognition and team building."
            ],
            holiday: [
                "Deck the halls and join us for holiday cheer!",
                "Tis the season to be jolly - join us for the celebration!",
                "Holiday magic awaits! Come celebrate with us.",
                "Join us for festive fun and holiday spirit!"
            ],
            casual: [
                "Good times, good friends, and good vibes await!",
                "Come hang out and make some memories!",
                "Your presence would make this gathering even better.",
                "Let's get together and have some fun!"
            ]
        };
        
        return suggestions[eventType] || suggestions.casual;
    }
}

module.exports = AIInvitationService;
