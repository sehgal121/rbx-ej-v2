        window.addEventListener('scroll', function() {
            var element1 = document.getElementById('element1');
            var element2 = document.getElementById('element2');
            var scrollPosition = window.scrollY || document.documentElement.scrollTop;

            // Change '500' and '1000' to the desired scroll levels in pixels
            if (scrollPosition > 1250) {
                element1.style.display = 'block';
                setTimeout(function() {
                    element1.style.opacity = 1;
                }, 50); // Small delay to ensure display change is rendered before opacity change
            }

            if (scrollPosition > 1500) {
                element2.style.display = 'block';
                setTimeout(function() {
                    element2.style.opacity = 1;
                }, 50); // Small delay to ensure display change is rendered before opacity change
            }
        });