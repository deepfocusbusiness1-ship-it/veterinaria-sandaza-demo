/* ==========================================================================
   INTERACTIVE JAVASCRIPT - CLINICA VETERINARIA SANDAZA
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    
    // Robust helper for Lucide Icons
    function safeCreateIcons() {
        try {
            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }
        } catch (e) {
            console.warn("Lucide no pudo inicializar iconos:", e);
        }
    }
    
    // Initial call
    safeCreateIcons();

    // 1. DETECCIÓN DE DISPOSITIVOS TÁCTILES Y SOPORTE DE LIBRERÍAS
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0 || window.matchMedia('(pointer: coarse)').matches;
    const hasGSAP = typeof gsap !== 'undefined';
    const hasScrollTrigger = typeof ScrollTrigger !== 'undefined';

    // 2. CURSOR PREMIUM PERSONALIZADO (Solo Escritorio)
    const cursor = document.getElementById('custom-cursor');
    if (!isTouchDevice && cursor && hasGSAP) {
        cursor.style.display = 'block';

        document.addEventListener('mousemove', (e) => {
            gsap.to(cursor, {
                x: e.clientX,
                y: e.clientY,
                duration: 0.1,
                ease: 'power2.out'
            });
        });

        // Hover expansions
        const hoverTags = 'a, button, input, select, textarea, .carousel-3d-card, .quick-card, .star-select-btn, .filter-btn';
        document.body.addEventListener('mouseenter', (e) => {
            if (e.target.matches && e.target.matches(hoverTags)) {
                cursor.style.transform = 'translate(-50%, -50%) scale(1.8)';
                cursor.style.backgroundColor = 'rgba(214, 175, 55, 0.1)';
                cursor.style.borderColor = 'var(--color-primary-light)';
            }
        }, true);

        document.body.addEventListener('mouseleave', (e) => {
            if (e.target.matches && e.target.matches(hoverTags)) {
                cursor.style.transform = 'translate(-50%, -50%) scale(1)';
                cursor.style.backgroundColor = 'transparent';
                cursor.style.borderColor = 'var(--color-accent)';
            }
        }, true);
    }

    // 3. SMOOTH SCROLL (LENIS)
    let lenis;
    try {
        if (typeof Lenis !== 'undefined') {
            lenis = new Lenis({
                duration: 1.2,
                easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
                direction: 'vertical',
                gestureDirection: 'vertical',
                smooth: true,
                mouseMultiplier: 1.0,
                smoothTouch: false,
            });

            // Sincronizar Lenis con GSAP ScrollTrigger
            if (hasGSAP && hasScrollTrigger) {
                lenis.on('scroll', ScrollTrigger.update);
                
                gsap.ticker.add((time) => {
                    lenis.raf(time * 1000);
                });
                gsap.ticker.lagSmoothing(0);
            }
        }
    } catch (err) {
        console.warn("Lenis no pudo cargarse, usando scroll nativo:", err);
    }

    // Header Shrink on Scroll
    window.addEventListener('scroll', () => {
        const header = document.getElementById('header');
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });

    // Scroll Reveal implementation (IntersectionObserver)
    const revealElements = document.querySelectorAll('.reveal');
    const revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.15,
        rootMargin: '0px 0px -50px 0px'
    });

    revealElements.forEach(el => revealObserver.observe(el));


    // 4. CARRUSEL 3D GIRATORIO (Hero Section)
    const carouselScene = document.getElementById('carousel-scene-3d');
    const carouselCards = document.querySelectorAll('.carousel-3d-card');
    const nextBtn = document.getElementById('carousel-next');
    const prevBtn = document.getElementById('carousel-prev');
    
    let currentAngle = 0;
    const cardCount = carouselCards.length;
    const theta = 360 / cardCount; // Ángulo por tarjeta
    const radius = window.innerWidth < 480 ? 150 : (window.innerWidth < 768 ? 180 : 220); // Radio del cilindro 3D dinámico según pantalla

    // Posicionar tarjetas en el espacio tridimensional
    function initCarousel() {
        carouselCards.forEach((card, index) => {
            const angle = index * theta;
            card.style.transform = `rotateY(${angle}deg) translateZ(${radius}px)`;
        });
    }
    
    function rotateCarousel(angle) {
        if (hasGSAP) {
            gsap.to(carouselScene, {
                rotateY: angle,
                duration: 1.0,
                ease: 'power3.out'
            });
        } else {
            carouselScene.style.transform = `rotateY(${angle}deg)`;
        }
    }

    if (carouselScene && cardCount > 0) {
        initCarousel();

        nextBtn.addEventListener('click', () => {
            currentAngle -= theta;
            rotateCarousel(currentAngle);
        });

        prevBtn.addEventListener('click', () => {
            currentAngle += theta;
            rotateCarousel(currentAngle);
        });

        // Auto-rotación sutil cada 6 segundos
        let autoRotateTimer = setInterval(() => {
            currentAngle -= theta;
            rotateCarousel(currentAngle);
        }, 6000);

        // Detener auto-rotación en interacción del usuario
        const stopAutoRotate = () => {
            clearInterval(autoRotateTimer);
        };

        nextBtn.addEventListener('mousedown', stopAutoRotate);
        prevBtn.addEventListener('mousedown', stopAutoRotate);
        carouselScene.addEventListener('touchstart', stopAutoRotate);

        // Drag/Swipe funcional para dispositivos móviles en el Carrusel 3D
        let startX = 0;
        let isDragging = false;
        let originalAngle = 0;

        carouselScene.addEventListener('mousedown', (e) => {
            startX = e.clientX;
            isDragging = true;
            originalAngle = currentAngle;
            stopAutoRotate();
        });

        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            const deltaX = e.clientX - startX;
            // 1px de arrastre equivale a 0.2 grados de rotación
            currentAngle = originalAngle + (deltaX * 0.25);
            carouselScene.style.transform = `rotateY(${currentAngle}deg)`;
        });

        document.addEventListener('mouseup', () => {
            if (!isDragging) return;
            isDragging = false;
            // Alinear al ángulo de tarjeta más cercano
            const snapIndex = Math.round(currentAngle / theta);
            currentAngle = snapIndex * theta;
            rotateCarousel(currentAngle);
        });

        // Touch drag para móviles
        carouselScene.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
            isDragging = true;
            originalAngle = currentAngle;
        });

        carouselScene.addEventListener('touchmove', (e) => {
            if (!isDragging) return;
            const deltaX = e.touches[0].clientX - startX;
            currentAngle = originalAngle + (deltaX * 0.25);
            carouselScene.style.transform = `rotateY(${currentAngle}deg)`;
        });

        carouselScene.addEventListener('touchend', () => {
            isDragging = false;
            const snapIndex = Math.round(currentAngle / theta);
            currentAngle = snapIndex * theta;
            rotateCarousel(currentAngle);
        });
    }


    // 5. SHOWROOM CLINICO 3D PINZADO (GSAP ScrollTrigger & matchMedia)
    if (hasGSAP && hasScrollTrigger) {
        try {
            // Contenido vectorial para las caras de las tarjetas
            const showroomSVGs = [
                // Cardiología SVG
                `<svg viewBox="0 0 300 300" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect width="300" height="300" fill="#0B6655"/>
                    <circle cx="150" cy="150" r="80" fill="white" opacity="0.08"/>
                    <!-- Corazón latiendo / EKG line -->
                    <path d="M50 150 L100 150 L115 110 L130 190 L145 130 L160 170 L175 150 L250 150" stroke="#D4AF37" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M150 90 C170 90 170 115 150 130 C130 115 130 90 150 90 Z" fill="#FAF9F6" opacity="0.25"/>
                 </svg>`,
                // Diagnóstico Digital SVG
                `<svg viewBox="0 0 300 300" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect width="300" height="300" fill="#07473B"/>
                    <circle cx="150" cy="150" r="75" fill="#D4AF37" opacity="0.08"/>
                    <!-- Computadora de Radiología / Pantalla -->
                    <rect x="60" y="70" width="180" height="130" rx="12" fill="#FAF9F6" opacity="0.1" stroke="#FAF9F6" stroke-width="4"/>
                    <rect x="75" y="85" width="150" height="100" rx="6" fill="#0B6655"/>
                    <path d="M150 200 L150 230 M110 230 L190 230" stroke="#FAF9F6" stroke-width="5" stroke-linecap="round"/>
                    <!-- Radiografía de Huesito de perro -->
                    <path d="M100 135 C100 125 110 125 115 130 C120 125 130 125 130 135 L170 135 C170 125 180 125 185 130 C190 125 200 125 200 135 C200 145 190 145 185 140 C180 145 170 145 170 135 L130 135 C130 145 120 145 115 140 C110 145 100 145 100 135 Z" fill="#D4AF37"/>
                 </svg>`,
                // Guardia e Internación SVG
                `<svg viewBox="0 0 300 300" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect width="300" height="300" fill="#0B6655"/>
                    <circle cx="150" cy="150" r="75" fill="white" opacity="0.08"/>
                    <!-- Cruz médica y escudo de protección -->
                    <path d="M150 60 L180 90 L220 90 L220 130 L250 160 L210 200 L180 240 L120 240 L90 200 L50 160 L80 130 L80 90 L120 90 Z" fill="none" stroke="#D4AF37" stroke-width="4"/>
                    <!-- Cruz interior -->
                    <rect x="135" y="110" width="30" height="80" rx="4" fill="#FAF9F6"/>
                    <rect x="110" y="135" width="80" height="30" rx="4" fill="#FAF9F6"/>
                 </svg>`
            ];

            const slideData = [
                {
                    category: "Cardiología",
                    title: "Exámenes Cardiovasculares",
                    backTitle: "Cardio Sandaza",
                    vets: "Dra. Sandaza / Dra. Rossi",
                    acred: "UAB Barcelona / UNL",
                    time: "Inmediato / En vivo"
                },
                {
                    category: "Diagnóstico Digital",
                    title: "Radiología y Ecografía",
                    backTitle: "Alta Resolución",
                    vets: "Dr. Sandaza / Tec. Gómez",
                    acred: "UNL Santa Fe",
                    time: "In situ (10 minutos)"
                },
                {
                    category: "Guardia 24h",
                    title: "Internación Crítica",
                    backTitle: "Monitoreo Sandaza",
                    vets: "Equipo de Guardia Activa",
                    acred: "UNL Residencias",
                    time: "Monitoreo 24/7"
                }
            ];

            const rotatingCard = document.getElementById('rotating-3d-card');
            const cardFrontImg = document.getElementById('showroom-card-front-img');
            const cardFrontCategory = document.getElementById('showroom-card-front-category');
            const cardFrontTitle = document.getElementById('showroom-card-front-title');
            const cardBackTitle = document.getElementById('showroom-card-back-title');
            const statVets = document.getElementById('showroom-stat-vets');
            const statAcred = document.getElementById('showroom-stat-acred');
            const statTime = document.getElementById('showroom-stat-time');

            // Carga inicial de datos
            cardFrontImg.innerHTML = showroomSVGs[0];
            
            // Usamos gsap.matchMedia para adaptar el comportamiento según tamaño de pantalla
            let mm = gsap.matchMedia();

            // 1. ESCRITORIO (> 1024px): Efecto Pinned con ScrollTrigger
            mm.add("(min-width: 1025px)", () => {
                const tlShowroom = gsap.timeline({
                    scrollTrigger: {
                        trigger: '.showroom-pin-container',
                        start: 'top top',
                        end: '+=250%',
                        pin: true,
                        scrub: 1.0,
                        onUpdate: (self) => {
                            const progress = self.progress;
                            let activeIndex = 0;

                            if (progress < 0.33) {
                                activeIndex = 0;
                            } else if (progress < 0.66) {
                                activeIndex = 1;
                            } else {
                                activeIndex = 2;
                            }

                            document.querySelectorAll('.showroom-slide-text').forEach((slide, index) => {
                                if (index === activeIndex) {
                                    slide.classList.add('active');
                                } else {
                                    slide.classList.remove('active');
                                }
                            });

                            document.querySelectorAll('.indicator-dot').forEach((dot, index) => {
                                if (index === activeIndex) {
                                    dot.classList.add('active');
                                } else {
                                    dot.classList.remove('active');
                                }
                            });
                        }
                    }
                });

                tlShowroom.to(rotatingCard, {
                    rotateY: 180,
                    duration: 1.0,
                    ease: 'none',
                    onStart: () => {
                        cardFrontCategory.innerText = slideData[0].category;
                        cardFrontTitle.innerText = slideData[0].title;
                        cardBackTitle.innerText = slideData[0].backTitle;
                        statVets.innerText = slideData[0].vets;
                        statAcred.innerText = slideData[0].acred;
                        statTime.innerText = slideData[0].time;
                    }
                });

                tlShowroom.to(rotatingCard, {
                    rotateY: 360,
                    duration: 1.0,
                    ease: 'none',
                    onStart: () => {
                        cardFrontImg.innerHTML = showroomSVGs[1];
                        cardFrontCategory.innerText = slideData[1].category;
                        cardFrontTitle.innerText = slideData[1].title;
                        cardBackTitle.innerText = slideData[1].backTitle;
                        statVets.innerText = slideData[1].vets;
                        statAcred.innerText = slideData[1].acred;
                        statTime.innerText = slideData[1].time;
                    }
                });

                tlShowroom.to(rotatingCard, {
                    rotateY: 540,
                    duration: 1.0,
                    ease: 'none',
                    onStart: () => {
                        cardFrontImg.innerHTML = showroomSVGs[2];
                        cardFrontCategory.innerText = slideData[2].category;
                        cardFrontTitle.innerText = slideData[2].title;
                        cardBackTitle.innerText = slideData[2].backTitle;
                        statVets.innerText = slideData[2].vets;
                        statAcred.innerText = slideData[2].acred;
                        statTime.innerText = slideData[2].time;
                    }
                });
            });

            // 2. MÓVIL/TABLET (<= 1024px): Carrusel Cíclico Automático con Tap-to-Flip
            mm.add("(max-width: 1024px)", () => {
                let activeIndex = 0;
                let isFlipped = false;
                
                // Función para actualizar el contenido de la tarjeta
                const updateCardContent = (index) => {
                    cardFrontImg.innerHTML = showroomSVGs[index];
                    cardFrontCategory.innerText = slideData[index].category;
                    cardFrontTitle.innerText = slideData[index].title;
                    cardBackTitle.innerText = slideData[index].backTitle;
                    statVets.innerText = slideData[index].vets;
                    statAcred.innerText = slideData[index].acred;
                    statTime.innerText = slideData[index].time;
                };

                // Ciclo automático sutil
                const autoCycle = () => {
                    // Voltear la tarjeta a 180 (o 360 si ya está volteada) y cambiar de cara
                    gsap.to(rotatingCard, {
                        rotateY: isFlipped ? 360 : 180,
                        duration: 0.6,
                        onComplete: () => {
                            isFlipped = !isFlipped;
                            activeIndex = (activeIndex + 1) % 3;
                            updateCardContent(activeIndex);
                            
                            // Volver a la cara frontal
                            gsap.to(rotatingCard, {
                                rotateY: isFlipped ? 180 : 0,
                                duration: 0.6
                            });
                        }
                    });
                };
                
                let cycleInterval = setInterval(autoCycle, 4000);

                // Tap manual para voltear
                const handleTap = () => {
                    // Detener el ciclo automático para que el usuario pueda leer
                    clearInterval(cycleInterval);
                    isFlipped = !isFlipped;
                    gsap.to(rotatingCard, {
                        rotateY: isFlipped ? 180 : 0,
                        duration: 0.6,
                        ease: 'power2.out'
                    });
                };

                rotatingCard.addEventListener('click', handleTap);

                // Cleanup al cambiar de breakpoint
                return () => {
                    clearInterval(cycleInterval);
                    rotatingCard.removeEventListener('click', handleTap);
                    gsap.set(rotatingCard, { clearProps: "all" });
                };
            });

        } catch (err) {
            console.warn("Fallo al inicializar el Showroom 3D de GSAP:", err);
        }
    }


    // 6. PORTAL "MI MASCOTA" (INTERACTIVO + LOCAL STORAGE)
    const petForm = document.getElementById('pet-register-form');
    const petBadge = document.getElementById('pet-3d-badge');
    const badgePhoto = document.getElementById('badge-photo');
    const badgeName = document.getElementById('badge-name');
    const badgeDetails = document.getElementById('badge-details');
    const badgeIdCode = document.getElementById('badge-id-code');
    const healthDashboard = document.getElementById('health-dashboard');
    const healthPetName = document.getElementById('health-pet-name');
    const healthTasksContainer = document.getElementById('health-tasks');

    // Efecto 3D Tilt en la credencial (Solo Escritorio)
    if (!isTouchDevice && petBadge && hasGSAP) {
        petBadge.addEventListener('mousemove', (e) => {
            const rect = petBadge.getBoundingClientRect();
            const x = e.clientX - rect.left; // Posición X del cursor en la tarjeta
            const y = e.clientY - rect.top;  // Posición Y del cursor en la tarjeta
            
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            
            // Calcular inclinación (Max 20deg)
            const rotateX = ((centerY - y) / centerY) * 15;
            const rotateY = ((x - centerX) / centerX) * 15;
            
            gsap.to(petBadge, {
                rotateX: rotateX,
                rotateY: rotateY,
                transformPerspective: 1000,
                duration: 0.2,
                ease: 'power2.out'
            });
        });

        petBadge.addEventListener('mouseleave', () => {
            gsap.to(petBadge, {
                rotateX: 0,
                rotateY: 0,
                duration: 0.6,
                ease: 'elastic.out(1, 0.5)'
            });
        });
    }

    // Funciones del Portal de Salud
    function generateId() {
        return 'SND-' + Math.floor(100000 + Math.random() * 900000);
    }

    function renderHealthTasks(type, age) {
        let tasks = [];
        const isPuppy = age <= 1;
        const isSenior = age >= 7;

        if (type === 'perro') {
            if (isPuppy) {
                tasks = [
                    { label: "Vacuna Quíntuple Preventiva", status: "done" },
                    { label: "Refuerzo de Parvovirus Canino", status: "pending" },
                    { label: "Desparasitación Interna (2da dosis)", status: "pending" },
                    { label: "Control de Crecimiento & Nutrición", status: "pending" }
                ];
            } else if (isSenior) {
                tasks = [
                    { label: "Chequeo Renal y Ecografía Geriátrica", status: "pending" },
                    { label: "Revisión Articular y Traumatológica", status: "pending" },
                    { label: "Vacuna Séxtuple Anual", status: "pending" },
                    { label: "Control Dental Preventivo", status: "done" }
                ];
            } else {
                tasks = [
                    { label: "Vacuna Séxtuple Anual Canina", status: "pending" },
                    { label: "Antirrábica Anual Obligatoria", status: "pending" },
                    { label: "Control de Parásitos y Pipeta mensual", status: "done" },
                    { label: "Chequeo Clínico de Rutina", status: "done" }
                ];
            }
        } else if (type === 'gato') {
            if (isPuppy) {
                tasks = [
                    { label: "Vacuna Triple Felina", status: "done" },
                    { label: "Test de VIF (Sida) & VILE (Leucemia)", status: "done" },
                    { label: "Vacuna Antirrábica", status: "pending" },
                    { label: "Desparasitación Inicial", status: "pending" }
                ];
            } else if (isSenior) {
                tasks = [
                    { label: "Perfil Renal Geriátrico (Extracción)", status: "pending" },
                    { label: "Monitoreo de Presión Arterial", status: "pending" },
                    { label: "Control Preventivo de Bolas de Pelo", status: "done" },
                    { label: "Triple Felina Anual", status: "pending" }
                ];
            } else {
                tasks = [
                    { label: "Triple Felina Anual de Refuerzo", status: "pending" },
                    { label: "Antirrábica Felina Anual", status: "pending" },
                    { label: "Control Alimenticio Gatos Castrados", status: "done" },
                    { label: "Desparasitación Preventiva semestral", status: "done" }
                ];
            }
        } else {
            // Otros animales
            tasks = [
                { label: "Control Clínico General de Especies", status: "done" },
                { label: "Asesoramiento Nutricional Exótico", status: "pending" },
                { label: "Desparasitación Preventiva adaptada", status: "pending" }
            ];
        }

        healthTasksContainer.innerHTML = '';
        tasks.forEach(task => {
            const li = document.createElement('li');
            li.className = 'health-task-item';
            
            const isDone = task.status === 'done';
            li.innerHTML = `
                <div class="health-task-info">
                    <i data-lucide="${isDone ? 'check-circle' : 'circle'}" class="health-task-check" style="color:${isDone ? 'var(--color-success)' : 'var(--color-text-light)'}"></i>
                    <span class="health-task-label" style="text-decoration:${isDone ? 'line-through' : 'none'}; color:${isDone ? 'var(--color-text-light)' : 'var(--color-text-primary)'}">${task.label}</span>
                </div>
                <span class="health-task-status ${isDone ? 'health-status-done' : 'health-status-pending'}">${isDone ? 'Completado' : 'Pendiente'}</span>
            `;
            healthTasksContainer.appendChild(li);
        });

        // Re-iniciar Lucide icons en las tareas
        safeCreateIcons();
    }

    function updateBadgeUI(name, type, age, breed, code) {
        badgeName.innerText = name;
        badgeDetails.innerHTML = `Especie: <span>${type.charAt(0).toUpperCase() + type.slice(1)}</span> | Raza: <span>${breed}</span> | Edad: <span>${age} ${age == 1 ? 'Año' : 'Años'}</span>`;
        badgeIdCode.innerText = code;

        // Cambiar icono del Badge
        if (type === 'gato') {
            badgePhoto.innerHTML = `<i data-lucide="cat" style="width:70px;height:70px;color:rgba(255,255,255,0.85)"></i>`;
        } else if (type === 'perro') {
            badgePhoto.innerHTML = `<i data-lucide="dog" style="width:70px;height:70px;color:rgba(255,255,255,0.85)"></i>`;
        } else {
            badgePhoto.innerHTML = `<i data-lucide="shield-alert" style="width:70px;height:70px;color:rgba(255,255,255,0.85)"></i>`;
        }
        safeCreateIcons();

        // Mostrar Panel de Salud
        healthPetName.innerText = name;
        healthDashboard.style.display = 'block';
        
        if (hasGSAP) {
            gsap.from(healthDashboard, {
                y: 30,
                opacity: 0,
                duration: 0.6,
                ease: 'power2.out'
            });
        }
    }

    // Guardado y Carga de LocalStorage
    function loadSavedPet() {
        const savedPet = localStorage.getItem('sandaza_registered_pet');
        if (savedPet) {
            try {
                const pet = JSON.parse(savedPet);
                updateBadgeUI(pet.name, pet.type, pet.age, pet.breed, pet.code);
                renderHealthTasks(pet.type, pet.age);
                
                // Rellenar formulario con datos guardados
                document.getElementById('pet-name').value = pet.name;
                document.getElementById('pet-type').value = pet.type;
                document.getElementById('pet-age').value = pet.age;
                document.getElementById('pet-breed').value = pet.breed;
            } catch (e) {
                console.error("Error leyendo mascota guardada:", e);
            }
        }
    }

    if (petForm) {
        loadSavedPet();

        petForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const name = document.getElementById('pet-name').value;
            const type = document.getElementById('pet-type').value;
            const age = parseInt(document.getElementById('pet-age').value);
            const breed = document.getElementById('pet-breed').value;
            const code = generateId();

            const petObj = { name, type, age, breed, code };
            localStorage.setItem('sandaza_registered_pet', JSON.stringify(petObj));

            // Animación del badge al actualizar
            if (hasGSAP) {
                gsap.to(petBadge, {
                    scale: 0.9,
                    rotateY: 180,
                    duration: 0.3,
                    onComplete: () => {
                        updateBadgeUI(name, type, age, breed, code);
                        renderHealthTasks(type, age);
                        gsap.to(petBadge, {
                            scale: 1,
                            rotateY: 0,
                            duration: 0.5,
                            ease: 'back.out(1.2)'
                        });
                    }
                });
            } else {
                updateBadgeUI(name, type, age, breed, code);
                renderHealthTasks(type, age);
            }
        });
    }


    // 7. INDICADOR DE HORARIO EN VIVO (GMT-3 ARGENTINA)
    function updateLiveStatus() {
        const statusText = document.getElementById('live-status-text');
        const statusBadge = document.getElementById('live-status');

        if (!statusText || !statusBadge) return;

        // Obtener la hora actual del sistema y convertirla a hora de Argentina (GMT-3)
        // La clínica abre de Lunes a Sábados de 08:00 a 19:00 hs.
        const now = new Date();
        const utcTime = now.getTime() + (now.getTimezoneOffset() * 60000);
        const argOffset = -3; // Argentina es GMT-3
        const argDate = new Date(utcTime + (3600000 * argOffset));

        const day = argDate.getDay(); // 0 = Domingo, 1 = Lunes, ..., 6 = Sábado
        const hours = argDate.getHours();
        const minutes = argDate.getMinutes();
        const currentTimeDecimal = hours + (minutes / 60);

        const isSunday = day === 0;
        const isOpenHours = currentTimeDecimal >= 8.0 && currentTimeDecimal < 19.0;

        if (!isSunday && isOpenHours) {
            statusBadge.className = "status-badge open";
            statusText.innerText = "Abierto ahora | Lun a Sab 8-19 hs";
        } else {
            statusBadge.className = "status-badge closed";
            statusText.innerText = "Cerrado | Guardia activa";
        }
    }

    updateLiveStatus();
    setInterval(updateLiveStatus, 60000); // Actualizar cada minuto


    // 8. SIMULADOR DE TURNOS
    const bookingForm = document.getElementById('booking-form');
    const bookingModal = document.getElementById('booking-modal');
    const confOrderCode = document.getElementById('conf-order-code');

    if (bookingForm) {
        // Bloquear fechas pasadas en el selector de turnos
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('book-date').setAttribute('min', today);

        bookingForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            // Generar código de prioridad
            const randCode = 'SND-' + Math.floor(1000 + Math.random() * 9000);
            confOrderCode.innerText = randCode;

            // Mostrar ticket de confirmación con animación
            bookingModal.style.display = 'block';
            
            if (hasGSAP) {
                gsap.fromTo(bookingModal, 
                    { height: 0, opacity: 0 },
                    { height: 'auto', opacity: 1, duration: 0.5, ease: 'power2.out' }
                );
            }

            // Ocultar formulario o deshabilitar
            bookingForm.querySelectorAll('input, select, textarea, button').forEach(el => {
                el.setAttribute('disabled', 'true');
                el.style.opacity = '0.6';
            });
        });
    }


    // 9. MÓDULO DE RESEÑAS DINÁMICAS (Contador de estrellas y filtrado)
    let reviewsDatabase = [
        {
            name: "Melisa R.",
            pet: "Cachorros Beagle (Consulta)",
            text: "Increíble la calidez con la que atendieron a los cachorritos. Me explicaron con paciencia todo el plan de vacunación inicial de la UNL. ¡Súper profesionales!",
            category: "perro",
            stars: 5
        },
        {
            name: "Gastón P.",
            pet: "Milo (Cardiología Felina)",
            text: "El Dr. Rossi atendió a Milo de su arritmia. La ecocardiografía doppler se hizo en el momento y salimos con el tratamiento listo. Cuentan con equipamiento excelente.",
            category: "cardiologia",
            stars: 5
        },
        {
            name: "Valeria F.",
            pet: "Roco (Estética Canina)",
            text: "Llevo siempre a Roco a baño y peluquería. Vuelve feliz y con el pelo espectacular. Todo el equipo es un amor, se nota que aman a los animales.",
            category: "perro",
            stars: 4
        },
        {
            name: "Ignacio M.",
            pet: "Simón (Cirugía de Guardia)",
            text: "Tuvimos que ir de urgencia un sábado por la tarde. Operaron a Simón de urgencia de una torsión de estómago. Le salvaron la vida. Agradecido para siempre.",
            category: "cardiologia",
            stars: 5
        },
        {
            name: "Clara G.",
            pet: "Pelusa (Consulta de Control)",
            text: "Amo este lugar, la atención post-consulta es excelente. Me llamaron al día siguiente para ver cómo seguía Pelusa de su resfriado. Totalmente recomendados.",
            category: "gato",
            stars: 5
        },
        {
            name: "Mariana S.",
            pet: "Felipe (Vacunas y Control)",
            text: "Excelente la atención de todo el equipo de Sandaza. Nos atendieron súper rápido con Felipe y nos guiaron en todas nuestras dudas. Muy amorosos y profesionales.",
            category: "gato",
            stars: 5
        }
    ];

    const reviewsContainer = document.getElementById('reviews-container');
    const filterButtons = document.querySelectorAll('#reviews-filters .filter-btn');
    const averageStarsNum = document.getElementById('average-stars-num');
    const averageStarsDisplay = document.getElementById('average-stars-display');

    function calculateAverageStars() {
        const total = reviewsDatabase.reduce((acc, rev) => acc + rev.stars, 0);
        const avg = (total / reviewsDatabase.length).toFixed(1);
        averageStarsNum.innerText = avg;

        // Renderizar estrellas de la cabecera con SVGs estables
        averageStarsDisplay.innerHTML = '';
        const fullStars = Math.floor(avg);
        const hasHalf = avg % 1 >= 0.5;

        for (let i = 1; i <= 5; i++) {
            let starHTML = '';
            if (i <= fullStars) {
                starHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="var(--color-accent)" stroke="var(--color-accent)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-star"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`;
            } else if (i === fullStars + 1 && hasHalf) {
                starHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-star-half"><path d="M12 2v15.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>`;
            } else {
                starHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-star"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`;
            }
            averageStarsDisplay.innerHTML += starHTML;
        }
    }

    function renderReviews(filter = 'all', isInitial = false) {
        if (!reviewsContainer) return;

        reviewsContainer.innerHTML = '';
        const filtered = filter === 'all' 
            ? reviewsDatabase 
            : reviewsDatabase.filter(rev => rev.category === filter);

        filtered.forEach(rev => {
            const card = document.createElement('div');
            card.className = 'review-card';
            
            // Generar fila de estrellas con SVGs inline
            let starsHTML = '';
            for (let i = 1; i <= 5; i++) {
                const filled = i <= rev.stars;
                starsHTML += `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="${filled ? 'var(--color-accent)' : 'none'}" stroke="var(--color-accent)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-star"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`;
            }

            card.innerHTML = `
                <div>
                    <div class="review-card-header">
                        <div class="reviewer-info">
                            <div class="reviewer-avatar">${rev.name.charAt(0)}</div>
                            <div>
                                <h4 class="reviewer-name">${rev.name}</h4>
                                <span class="reviewer-pet">${rev.pet}</span>
                            </div>
                        </div>
                        <div class="review-stars">${starsHTML}</div>
                    </div>
                    <p class="review-text">"${rev.text}"</p>
                </div>
            `;
            reviewsContainer.appendChild(card);
        });

        // Animar entrada de las nuevas tarjetas filtradas solo al interactuar (no en carga inicial)
        if (hasGSAP) {
            if (isInitial) {
                // En la carga inicial, el IntersectionObserver de CSS maneja la animación del contenedor (.reveal)
            } else {
                gsap.from(reviewsContainer.children, {
                    opacity: 0,
                    y: 15,
                    stagger: 0.05,
                    duration: 0.3,
                    ease: 'power1.out'
                });
            }
        }
    }

    // Inicializar reseñas
    if (reviewsContainer) {
        calculateAverageStars();
        renderReviews('all', true);

        // Asignar listeners a filtros
        filterButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                filterButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                const filterValue = btn.getAttribute('data-filter');
                renderReviews(filterValue);
            });
        });
    }

    // 10. MENÚ DE NAVEGACIÓN MÓVIL COLLAPSIBLE
    const menuToggle = document.getElementById('menu-toggle');
    const navMenu = document.querySelector('.nav-menu');
    
    if (menuToggle && navMenu) {
        menuToggle.addEventListener('click', () => {
            navMenu.classList.toggle('open');
            const isOpen = navMenu.classList.contains('open');
            menuToggle.innerHTML = `<i data-lucide="${isOpen ? 'x' : 'menu'}" style="width:24px;height:24px;"></i>`;
            safeCreateIcons();
        });
        
        // Cerrar menú al hacer clic en un enlace de sección
        navMenu.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', () => {
                navMenu.classList.remove('open');
                menuToggle.innerHTML = `<i data-lucide="menu" style="width:24px;height:24px;"></i>`;
                safeCreateIcons();
            });
        });
    }
});
