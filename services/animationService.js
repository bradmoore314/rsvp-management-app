// Animation Service for Invitation Effects
class AnimationService {
    constructor() {
        this.animations = {
            cardOpen: {
                name: 'Card Opening',
                description: '3D card flip animation with smooth transitions',
                duration: 2000,
                easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
            },
            reveal: {
                name: 'Elegant Reveal',
                description: 'Smooth fade-in with scale animation',
                duration: 1500,
                easing: 'ease-out'
            },
            slideIn: {
                name: 'Slide In',
                description: 'Content slides in from different directions',
                duration: 1200,
                easing: 'ease-in-out'
            },
            particle: {
                name: 'Particle Effect',
                description: 'Floating particles with invitation reveal',
                duration: 3000,
                easing: 'ease-out'
            }
        };
    }

    // Initialize Three.js scene for 3D card animation
    initThreeJSScene(container) {
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
        const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
        
        renderer.setSize(container.clientWidth, container.clientHeight);
        renderer.setClearColor(0x000000, 0);
        container.appendChild(renderer.domElement);

        // Add lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(10, 10, 5);
        scene.add(directionalLight);

        return { scene, camera, renderer };
    }

    // Create 3D card opening animation
    createCardOpeningAnimation(invitationData, container) {
        const { scene, camera, renderer } = this.initThreeJSScene(container);
        
        // Create card geometry
        const cardGeometry = new THREE.PlaneGeometry(4, 6);
        const cardMaterial = new THREE.MeshLambertMaterial({ 
            color: 0xffffff,
            side: THREE.DoubleSide
        });
        
        const card = new THREE.Mesh(cardGeometry, cardMaterial);
        scene.add(card);

        // Position camera
        camera.position.z = 8;

        // Animation timeline
        const timeline = gsap.timeline();
        
        // Initial state
        gsap.set(card.rotation, { x: 0, y: 0, z: 0 });
        gsap.set(card.position, { x: 0, y: 0, z: 0 });
        gsap.set(card.scale, { x: 0.1, y: 0.1, z: 0.1 });

        // Card opening animation
        timeline
            .to(card.scale, { 
                duration: 0.8, 
                x: 1, 
                y: 1, 
                z: 1, 
                ease: "back.out(1.7)" 
            })
            .to(card.rotation, { 
                duration: 1.2, 
                y: Math.PI * 0.5, 
                ease: "power2.inOut" 
            }, "-=0.4")
            .to(card.rotation, { 
                duration: 1.0, 
                y: Math.PI, 
                ease: "power2.inOut" 
            }, "-=0.2");

        // Render loop
        const animate = () => {
            requestAnimationFrame(animate);
            renderer.render(scene, camera);
        };
        animate();

        return timeline;
    }

    // Create elegant reveal animation
    createRevealAnimation(element, options = {}) {
        const defaults = {
            duration: 1.5,
            delay: 0,
            ease: "power2.out",
            from: { opacity: 0, scale: 0.8, y: 50 },
            to: { opacity: 1, scale: 1, y: 0 }
        };

        const config = { ...defaults, ...options };
        
        gsap.set(element, config.from);
        
        return gsap.to(element, {
            duration: config.duration,
            delay: config.delay,
            ease: config.ease,
            ...config.to
        });
    }

    // Create particle effect animation
    createParticleEffect(container, invitationData) {
        const particles = [];
        const particleCount = 50;
        
        // Create particle system
        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            particle.style.cssText = `
                position: absolute;
                width: 4px;
                height: 4px;
                background: ${this.getRandomColor()};
                border-radius: 50%;
                pointer-events: none;
                z-index: 1000;
            `;
            
            // Random starting position
            particle.style.left = Math.random() * container.clientWidth + 'px';
            particle.style.top = Math.random() * container.clientHeight + 'px';
            
            container.appendChild(particle);
            particles.push(particle);
        }

        // Animate particles
        particles.forEach((particle, index) => {
            gsap.set(particle, {
                scale: 0,
                opacity: 0
            });

            gsap.to(particle, {
                duration: 2,
                delay: index * 0.02,
                scale: 1,
                opacity: 1,
                ease: "back.out(1.7)"
            });

            gsap.to(particle, {
                duration: 3,
                delay: index * 0.02 + 1,
                y: -100,
                x: (Math.random() - 0.5) * 200,
                rotation: 360,
                ease: "power2.out"
            });

            gsap.to(particle, {
                duration: 1,
                delay: index * 0.02 + 3,
                scale: 0,
                opacity: 0,
                ease: "power2.in"
            });
        });

        // Clean up particles after animation
        setTimeout(() => {
            particles.forEach(particle => {
                if (particle.parentNode) {
                    particle.parentNode.removeChild(particle);
                }
            });
        }, 6000);
    }

    // Create invitation reveal sequence
    createInvitationReveal(invitationData, container) {
        const timeline = gsap.timeline();
        
        // Create invitation elements
        const invitationCard = this.createInvitationCard(invitationData);
        container.appendChild(invitationCard);

        // Set initial state
        gsap.set(invitationCard, {
            scale: 0,
            rotationY: 180,
            opacity: 0
        });

        // Create particle effect
        this.createParticleEffect(container, invitationData);

        // Main reveal animation
        timeline
            .to(invitationCard, {
                duration: 1.2,
                scale: 1,
                rotationY: 0,
                opacity: 1,
                ease: "back.out(1.7)"
            })
            .to(invitationCard.querySelector('.invitation-content'), {
                duration: 0.8,
                opacity: 1,
                y: 0,
                ease: "power2.out"
            }, "-=0.6");

        return timeline;
    }

    // Create invitation card element
    createInvitationCard(invitationData) {
        const card = document.createElement('div');
        card.className = 'invitation-card';
        card.style.cssText = `
            position: relative;
            width: 400px;
            height: 600px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 20px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.3);
            transform-style: preserve-3d;
            margin: 20px auto;
            overflow: hidden;
        `;

        const content = document.createElement('div');
        content.className = 'invitation-content';
        content.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            padding: 40px;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            text-align: center;
            color: white;
            opacity: 0;
            transform: translateY(30px);
        `;

        content.innerHTML = `
            <h1 style="font-size: 2.5rem; margin-bottom: 20px; font-weight: bold;">
                ${invitationData.content.title}
            </h1>
            <p style="font-size: 1.2rem; margin-bottom: 15px;">
                ${invitationData.content.date}
            </p>
            <p style="font-size: 1.1rem; margin-bottom: 15px;">
                ${invitationData.content.time}
            </p>
            <p style="font-size: 1rem; margin-bottom: 30px;">
                ${invitationData.content.location}
            </p>
            <div style="background: rgba(255,255,255,0.2); padding: 20px; border-radius: 10px; backdrop-filter: blur(10px);">
                <p style="font-size: 0.9rem; margin: 0;">
                    ${invitationData.content.rsvpMessage}
                </p>
            </div>
        `;

        card.appendChild(content);
        return card;
    }

    // Get random color for particles
    getRandomColor() {
        const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57', '#FF9FF3'];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    // Create theme-specific animations
    createThemeAnimation(theme, element) {
        const animations = {
            birthday: () => this.createBirthdayAnimation(element),
            wedding: () => this.createWeddingAnimation(element),
            corporate: () => this.createCorporateAnimation(element),
            holiday: () => this.createHolidayAnimation(element),
            casual: () => this.createCasualAnimation(element)
        };

        return animations[theme] ? animations[theme]() : animations.casual();
    }

    // Birthday-specific animation
    createBirthdayAnimation(element) {
        return gsap.timeline()
            .to(element, { duration: 0.5, scale: 1.1, ease: "power2.out" })
            .to(element, { duration: 0.3, rotation: 5, ease: "power2.inOut" })
            .to(element, { duration: 0.3, rotation: -5, ease: "power2.inOut" })
            .to(element, { duration: 0.3, rotation: 0, scale: 1, ease: "power2.out" });
    }

    // Wedding-specific animation
    createWeddingAnimation(element) {
        return gsap.timeline()
            .to(element, { duration: 1, opacity: 0, scale: 0.8, ease: "power2.in" })
            .to(element, { duration: 1, opacity: 1, scale: 1, ease: "power2.out" });
    }

    // Corporate-specific animation
    createCorporateAnimation(element) {
        return gsap.timeline()
            .to(element, { duration: 0.8, y: -20, ease: "power2.out" })
            .to(element, { duration: 0.8, y: 0, ease: "power2.inOut" });
    }

    // Holiday-specific animation
    createHolidayAnimation(element) {
        return gsap.timeline()
            .to(element, { duration: 0.3, rotation: 10, ease: "power2.inOut" })
            .to(element, { duration: 0.3, rotation: -10, ease: "power2.inOut" })
            .to(element, { duration: 0.3, rotation: 10, ease: "power2.inOut" })
            .to(element, { duration: 0.3, rotation: 0, ease: "power2.out" });
    }

    // Casual-specific animation
    createCasualAnimation(element) {
        return gsap.timeline()
            .to(element, { duration: 0.6, scale: 1.05, ease: "power2.out" })
            .to(element, { duration: 0.6, scale: 1, ease: "power2.inOut" });
    }

    // Get available animations
    getAvailableAnimations() {
        return Object.keys(this.animations).map(key => ({
            id: key,
            ...this.animations[key]
        }));
    }
}

module.exports = AnimationService;
