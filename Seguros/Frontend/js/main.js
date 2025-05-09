// js/main.js

/**
 * Espera a que el contenido del DOM esté completamente cargado y parseado
 * antes de ejecutar cualquier script. Esto previene errores al intentar
 * acceder a elementos que aún no existen.
 */
document.addEventListener('DOMContentLoaded', () => {

    /**
     * Constantes para seleccionar elementos del DOM.
     * Guardar selecciones frecuentes en variables mejora el rendimiento
     * y la legibilidad del código.
     */
    const mobileMenuButton = document.getElementById('mobile-menu-button');
    const mobileMenu = document.getElementById('mobile-menu');
    const desktopMenuLinks = document.querySelectorAll('#desktop-menu .nav-link');
    const mobileMenuLinks = document.querySelectorAll('#mobile-menu .nav-link');
    const allNavLinks = document.querySelectorAll('header nav a[href^="#"]'); // Incluye logo y todos los links de nav
    const currentYearElement = document.getElementById('currentYear');
    const contactForm = document.getElementById('contactForm');
    const formMessageContainer = document.getElementById('formMessageContainer'); // Contenedor del mensaje
    const formMessageElement = document.getElementById('formMessage'); // Elemento p para el mensaje
    const sectionsToFadeIn = document.querySelectorAll('.fade-in-section');
    const sectionsForNavHighlight = document.querySelectorAll('main section[id]');
    const headerNav = document.querySelector('header nav');


    /**
     * Gestiona la funcionalidad del menú de navegación móvil.
     * Alterna la visibilidad del menú y el estado ARIA del botón.
     * Cambia el icono del botón entre 'hamburguesa' y 'cierre'.
     */
    function setupMobileMenu() {
        if (!mobileMenuButton || !mobileMenu) return;

        const menuIcon = mobileMenuButton.querySelector('i');

        mobileMenuButton.addEventListener('click', () => {
            const isExpanded = mobileMenuButton.getAttribute('aria-expanded') === 'true';
            mobileMenuButton.setAttribute('aria-expanded', !isExpanded);
            mobileMenu.classList.toggle('hidden');
            
            if (menuIcon) {
                menuIcon.classList.toggle('fa-bars', isExpanded); // Si estaba expandido (true), ahora es false, poner fa-bars
                menuIcon.classList.toggle('fa-times', !isExpanded); // Si NO estaba expandido (false), ahora es true, poner fa-times
            }
        });

        // Cierra el menú móvil al hacer clic en uno de sus enlaces.
        mobileMenuLinks.forEach(link => {
            link.addEventListener('click', () => {
                if (!mobileMenu.classList.contains('hidden')) {
                    mobileMenu.classList.add('hidden');
                    mobileMenuButton.setAttribute('aria-expanded', 'false');
                    if (menuIcon) {
                        menuIcon.classList.remove('fa-times');
                        menuIcon.classList.add('fa-bars');
                    }
                }
            });
        });
    }

    /**
     * Actualiza dinámicamente el año en el pie de página.
     */
    function updateFooterYear() {
        if (currentYearElement) {
            currentYearElement.textContent = new Date().getFullYear();
        }
    }

    /**
     * Valida un campo individual del formulario.
     * @param {HTMLInputElement|HTMLTextAreaElement} field - El campo a validar.
     * @returns {boolean} - True si el campo es válido, false en caso contrario.
     */
    function validateField(field) {
        const errorElement = contactForm.querySelector(`[data-error-for="${field.id}"]`);
        let isValid = true;
        let errorMessage = "";

        // Limpiar errores previos
        field.classList.remove('border-red-500');
        if (errorElement) errorElement.classList.add('hidden');

        if (field.hasAttribute('required') && !field.value.trim()) {
            isValid = false;
            errorMessage = "Este campo es obligatorio.";
        } else if (field.type === 'email' && field.value.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(field.value.trim())) {
            isValid = false;
            errorMessage = "Por favor, introduzca un correo electrónico válido.";
        }
        // Aquí se podrían añadir más validaciones (ej. teléfono, etc.)

        if (!isValid) {
            field.classList.add('border-red-500');
            if (errorElement) {
                errorElement.textContent = errorMessage;
                errorElement.classList.remove('hidden');
            }
        }
        return isValid;
    }


    /**
     * Gestiona el envío del formulario de contacto.
     * Realiza validación del lado del cliente y envía los datos al backend.
     */
    function setupContactForm() {
        if (!contactForm || !formMessageElement) return;

        const submitButton = contactForm.querySelector('button[type="submit"]');

        contactForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            let formIsValid = true;

            // Validar todos los campos
            const fieldsToValidate = contactForm.querySelectorAll('input[required], textarea[required], input[type="email"]');
            fieldsToValidate.forEach(field => {
                if (!validateField(field)) {
                    formIsValid = false;
                }
            });

            if (!formIsValid) {
                formMessageElement.textContent = 'Por favor, corrija los errores en el formulario.';
                formMessageElement.className = 'text-center text-sm text-red-600 font-semibold';
                if (formMessageContainer) formMessageContainer.setAttribute("role", "alert");
                return;
            }

            const originalButtonText = submitButton.textContent;
            submitButton.disabled = true;
            submitButton.textContent = 'Enviando...';
            formMessageElement.textContent = 'Procesando su solicitud...';
            formMessageElement.className = 'text-center text-sm text-sky-600';
            if (formMessageContainer) formMessageContainer.removeAttribute("role");


            const formData = new FormData(contactForm);
            const dataToSend = Object.fromEntries(formData.entries());

            try {
                const response = await fetch('http://127.0.0.1:5001/api/contact', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(dataToSend),
                });

                const result = await response.json();

                if (response.ok) {
                    formMessageElement.textContent = result.message || '¡Mensaje enviado con éxito!';
                    formMessageElement.className = 'text-center text-sm text-green-600 font-semibold';
                    if (formMessageContainer) formMessageContainer.setAttribute("role", "status");
                    contactForm.reset();
                    // Limpiar clases de error de todos los campos
                    fieldsToValidate.forEach(field => {
                         field.classList.remove('border-red-500');
                         const errorElem = contactForm.querySelector(`[data-error-for="${field.id}"]`);
                         if(errorElem) errorElem.classList.add('hidden');
                    });
                } else {
                    formMessageElement.textContent = result.message || 'Error al enviar el mensaje. Inténtelo más tarde.';
                    formMessageElement.className = 'text-center text-sm text-red-600 font-semibold';
                    if (formMessageContainer) formMessageContainer.setAttribute("role", "alert");
                }
            } catch (error) {
                console.error('Error de red o conexión al enviar el formulario:', error);
                formMessageElement.textContent = 'Error de conexión. Verifique su red o inténtelo más tarde.';
                formMessageElement.className = 'text-center text-sm text-red-600 font-semibold';
                if (formMessageContainer) formMessageContainer.setAttribute("role", "alert");
            } finally {
                submitButton.disabled = false;
                submitButton.textContent = originalButtonText;
                setTimeout(() => {
                    // No borrar mensajes de error automáticamente, solo los de éxito si se desea
                    if (formMessageElement.className.includes('text-green-600')) {
                        // formMessageElement.textContent = ''; // Descomentar para borrar mensaje de éxito
                    }
                }, 7000);
            }
        });

        // Validación en tiempo real al salir del campo (on blur)
        contactForm.querySelectorAll('input[required], textarea[required], input[type="email"]').forEach(field => {
            field.addEventListener('blur', () => validateField(field));
        });
    }

    /**
     * Configura IntersectionObserver para animar secciones cuando entran en el viewport.
     */
    function setupFadeInAnimations() {
        if (sectionsToFadeIn.length === 0 || !('IntersectionObserver' in window)) return;

        const observerOptions = {
            root: null,
            rootMargin: '0px',
            threshold: 0.15,
        };

        const intersectionCallback = (entries, observerInstance) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                    observerInstance.unobserve(entry.target);
                }
            });
        };

        const observer = new IntersectionObserver(intersectionCallback, observerOptions);
        sectionsToFadeIn.forEach(section => observer.observe(section));
    }

    /**
     * Gestiona el desplazamiento suave (smooth scroll) para los enlaces de ancla
     * y actualiza el enlace activo en la barra de navegación.
     */
    function setupSmoothScrollingAndActiveNav() {
        if (!headerNav) return; // Salir si no hay barra de navegación

        const navbarHeight = headerNav.offsetHeight;

        allNavLinks.forEach(anchor => {
            anchor.addEventListener('click', function (event) {
                const targetId = this.getAttribute('href');
                if (targetId && targetId.startsWith('#')) {
                    event.preventDefault();
                    const targetElement = document.querySelector(targetId);

                    if (targetElement) {
                        let headerOffset = navbarHeight + 20;
                        if (window.innerWidth < 768 && targetId === '#inicio') {
                            headerOffset = navbarHeight / 1.5;
                        } else if (targetId === '#inicio') {
                            headerOffset = 0;
                        }
                        
                        const elementPosition = targetElement.getBoundingClientRect().top;
                        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

                        window.scrollTo({
                            top: offsetPosition,
                            behavior: 'smooth',
                        });

                        // Cierra el menú móvil si está abierto y es un enlace del menú móvil
                        if (mobileMenu && !mobileMenu.classList.contains('hidden') && Array.from(mobileMenuLinks).includes(this)) {
                            mobileMenu.classList.add('hidden');
                            if(mobileMenuButton) mobileMenuButton.setAttribute('aria-expanded', 'false');
                            const menuIcon = mobileMenuButton ? mobileMenuButton.querySelector('i') : null;
                            if (menuIcon) {
                                menuIcon.classList.remove('fa-times');
                                menuIcon.classList.add('fa-bars');
                            }
                        }
                    }
                }
            });
        });

        // Actualiza el enlace activo en la navegación al hacer scroll.
        if (sectionsForNavHighlight.length > 0) {
            const updateActiveState = () => {
                let currentSectionId = '';
                const scrollPosition = window.pageYOffset;

                sectionsForNavHighlight.forEach(section => {
                    const sectionTop = section.offsetTop - navbarHeight - 60; // Ajuste de offset más generoso
                    if (scrollPosition >= sectionTop) {
                        currentSectionId = section.getAttribute('id');
                    }
                });
                
                // Si no se detectó sección (ej. estamos al final y la última sección es corta)
                // o estamos muy arriba, forzar 'inicio' si es la primera sección.
                if (!currentSectionId && sectionsForNavHighlight.length > 0 && sectionsForNavHighlight[0].id === 'inicio' && scrollPosition < sectionsForNavHighlight[0].offsetTop) {
                    currentSectionId = 'inicio';
                }


                [...desktopMenuLinks, ...mobileMenuLinks].forEach(link => {
                    link.classList.remove('nav-link-active');
                    const linkHref = link.getAttribute('href');
                    if (linkHref === `#${currentSectionId}`) {
                        link.classList.add('nav-link-active');
                    }
                });
            };

            // Throttling para la función de scroll para mejorar rendimiento
            let scrollTimeout;
            window.addEventListener('scroll', () => {
                clearTimeout(scrollTimeout);
                scrollTimeout = setTimeout(updateActiveState, 100); // Ejecutar cada 100ms como máximo
            });
            updateActiveState(); // Llamada inicial
        }
    }

    // --- Inicializar todas las funcionalidades ---
    setupMobileMenu();
    updateFooterYear();
    setupContactForm();
    setupFadeInAnimations();
    setupSmoothScrollingAndActiveNav();

});
