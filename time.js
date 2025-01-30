document.addEventListener("DOMContentLoaded", function () {
    function formatTime(hours, minutes) {
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;   // Convert 24-hour format to 12-hour format
      hours = hours ? hours : 12;  // If hours is 0, set it to 12 (midnight case)
      minutes = minutes < 10 ? '0' + minutes : minutes;  // Add leading zero if minutes are less than 10
      
      return hours + ':' + minutes + ' ' + ampm;
    }

    function updateTime() {
      const now = new Date();
      const hours = now.getHours();
      const minutes = now.getMinutes();
      
      console.log(`Current time: ${hours}:${minutes}`);  // Debugging: Log the raw time
  
      const timeString = formatTime(hours, minutes);
      
      // Ensure the element is available before trying to update it
      const timeElement = document.getElementById('Heading');
      if (timeElement) {
        timeElement.textContent = timeString;
      }
    }
  
    // Update the time immediately when the script is loaded
    updateTime();
  
    // Update the time every second
    setInterval(updateTime, 1000);
  });
  