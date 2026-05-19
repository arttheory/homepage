document.addEventListener('DOMContentLoaded', () => {
    // --- Configuration ---
    // In a real app, this would come from a backend/API
    const seminarEvents = {
        "2026-01-29": {
            slots: [
                { time: "10:00 - 11:30", capacity: 4, booked: 0 }
            ]
        }
    };

    // --- Calendar Logic ---
    const calendarGrid = document.getElementById('calendarGrid');
    const currentMonthLabel = document.getElementById('currentMonthLabel');
    const prevMonthBtn = document.getElementById('prevMonth');
    const nextMonthBtn = document.getElementById('nextMonth');

    // Start from current date
    let currentDate = new Date(); // Use system time (2026-01-20 from metadata)

    function renderCalendar(date) {
        calendarGrid.innerHTML = '';

        const year = date.getFullYear();
        const month = date.getMonth();

        // Month Names
        const monthNames = ["January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December"
        ];
        currentMonthLabel.innerText = `${monthNames[month]} ${year}`;

        // First day of the month (0=Sun, 1=Mon...)
        const firstDayIndex = new Date(year, month, 1).getDay();

        // Days in current month
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        // Previous month filler
        for (let x = firstDayIndex; x > 0; x--) {
            const div = document.createElement('div');
            div.classList.add('calendar-cell', 'empty');
            calendarGrid.appendChild(div);
        }

        // Current month days
        const today = new Date();

        for (let i = 1; i <= daysInMonth; i++) {
            const div = document.createElement('div');
            div.classList.add('calendar-cell');
            div.innerText = i;

            // Date String key (YYYY-MM-DD) for lookup
            // Pad month/day with 0 if needed
            const monthStr = (month + 1).toString().padStart(2, '0');
            const dayStr = i.toString().padStart(2, '0');
            const dateKey = `${year}-${monthStr}-${dayStr}`;

            // Check if it's today
            if (i === today.getDate() && month === today.getMonth() && year === today.getFullYear()) {
                div.classList.add('today');
            }

            // Check availability
            if (seminarEvents[dateKey]) {
                div.classList.add('has-event');
                div.style.cursor = 'pointer';
                div.title = "Click to book";

                // Click event only for days with events
                div.addEventListener('click', () => {
                    openModal(new Date(year, month, i), seminarEvents[dateKey]);
                });
            } else {
                div.style.color = '#444'; // Dim unavailable days
                div.style.cursor = 'default';
            }

            calendarGrid.appendChild(div);
        }
    }

    // Navigation
    prevMonthBtn.addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() - 1);
        renderCalendar(currentDate);
    });

    nextMonthBtn.addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() + 1);
        renderCalendar(currentDate);
    });

    // Initial Render
    renderCalendar(currentDate);


    // --- Modal & Booking Logic ---
    const modal = document.getElementById('bookingModal');
    const closeModalBtn = document.querySelector('.close-modal');
    const selectedDateDisplay = document.getElementById('selectedDateDisplay');
    const bookingForm = document.getElementById('bookingForm');
    const modalContent = document.querySelector('.modal-content');
    const successMessage = document.getElementById('successMessage');
    const closeSuccessBtn = document.getElementById('closeSuccessBtn');

    // Hidden inputs
    const formDateInput = document.getElementById('formDate');
    const formTimeInput = document.getElementById('formTime');
    const capacityDisplay = document.getElementById('capacityDisplay');

    function openModal(date, eventData) {
        const dateString = date.toLocaleDateString('ja-JP', {
            year: 'numeric', month: 'long', day: 'numeric', weekday: 'short'
        });

        // Update UI
        selectedDateDisplay.innerText = `Selected Date: ${dateString}`;

        // Assume first slot for this demo (or extend UI to allow slot selection)
        const slot = eventData.slots[0];

        // Fill hidden data
        const dateISO = date.toISOString().split('T')[0];
        formDateInput.value = dateISO;
        formTimeInput.value = slot.time;

        // Update slot info display
        document.getElementById('bookingTimeDisplay').innerText = slot.time;
        capacityDisplay.innerText = slot.capacity;

        // Reset state
        modalContent.style.display = 'block';
        successMessage.style.display = 'none';
        bookingForm.reset();

        modal.style.display = 'flex';
        // Add minimal delay to allow display:flex to apply before adding active class for opacity transition
        setTimeout(() => {
            modal.classList.add('active');
        }, 10);
    }

    function closeModal() {
        modal.classList.remove('active');
        setTimeout(() => {
            modal.style.display = 'none';
        }, 300); // Wait for transition
    }

    closeModalBtn.addEventListener('click', closeModal);

    // Close on click outside
    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });

    // Form Submission
    bookingForm.addEventListener('submit', (e) => {
        e.preventDefault();

        // UI Loading State
        const btn = bookingForm.querySelector('button');
        const originalText = btn.innerText;
        btn.innerText = '送信中...';
        btn.disabled = true;

        // Form Submit to Formsubmit.co via AJAX
        const formData = new FormData(bookingForm);

        fetch("https://formsubmit.co/ajax/perchecoffeeroaster@gmail.com", {
            method: "POST",
            body: formData
        })
            .then(async response => {
                const data = await response.json();
                if (!response.ok) {
                    throw new Error(data.message || "送信に失敗しました (Server Error)");
                }
                console.log(data);
                // Hide form, show success
                modalContent.style.display = 'none';
                successMessage.style.display = 'block';
            })
            .catch(error => {
                console.error('Error:', error);
                alert("エラーが発生しました: " + error.message + "\n\n※ローカル環境(file://)ではなく、http://localhost:8000 でアクセスして試してください。");
            })
            .finally(() => {
                btn.innerText = originalText;
                btn.disabled = false;
            });
    });

    closeSuccessBtn.addEventListener('click', closeModal);
});
