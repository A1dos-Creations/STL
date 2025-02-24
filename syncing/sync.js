// sync.js
export async function syncGoogleTasks() {
    try {
      // Obtain the OAuth token (prompts the user if necessary)
      const token = await getAuthToken();
      // Fetch events from Google Calendar
      const calendarTasks = await fetchCalendarEvents(token);
      // Fetch assignments from Google Classroom
      const classroomTasks = await fetchClassroomAssignments(token);
  
      // Map fetched data into a unified task format
      const googleTasks = [
        ...calendarTasks.map(event => ({
          text: event.summary || 'No Title',
          due: event.start ? (event.start.dateTime || event.start.date) : null,
          source: 'google-calendar',
          id: event.id
        })),
        ...classroomTasks.map(assignment => ({
          text: assignment.title,
          due: assignment.dueDate ? formatDueDate(assignment.dueDate) : null,
          source: 'google-classroom',
          id: assignment.id
        }))
      ];
  
      // Save the combined tasks while preserving any manual tasks
      chrome.storage.local.get(['tasks'], (result) => {
        let existingTasks = result.tasks || [];
        // Remove tasks previously synced from Google
        existingTasks = existingTasks.filter(task =>
          task.source !== 'google-calendar' && task.source !== 'google-classroom'
        );
        const newTasks = [...existingTasks, ...googleTasks];
        chrome.storage.local.set({ tasks: newTasks }, () => {
          console.log('Synced Google tasks saved.');
        });
      });
    } catch (error) {
      console.error('Error in syncing Google tasks:', error);
      throw error;
    }
  }
  
  function getAuthToken() {
    return new Promise((resolve, reject) => {
      chrome.identity.getAuthToken({ interactive: true }, (token) => {
        if (chrome.runtime.lastError || !token) {
          return reject(new Error(chrome.runtime.lastError ? chrome.runtime.lastError.message : 'Failed to get token'));
        }
        resolve(token);
      });
    });
  }
  
  async function fetchCalendarEvents(token) {
    // Fetch upcoming events from the primary calendar
    const calendarId = 'primary';
    const timeMin = new Date().toISOString();
    const url = `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events?timeMin=${encodeURIComponent(timeMin)}&singleEvents=true&orderBy=startTime`;
    
    const response = await fetch(url, {
      headers: {
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json'
      }
    });
    const data = await response.json();
    if (data.error) {
      throw new Error(data.error.message);
    }
    return data.items || [];
  }
  
  async function fetchClassroomAssignments(token) {
    // Get the list of courses
    const coursesResponse = await fetch('https://classroom.googleapis.com/v1/courses', {
      headers: {
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json'
      }
    });
    const coursesData = await coursesResponse.json();
    if (coursesData.error) {
      throw new Error(coursesData.error.message);
    }
    const courses = coursesData.courses || [];
    let assignments = [];
    // For each course, fetch its coursework (assignments)
    for (const course of courses) {
      const courseworkUrl = `https://classroom.googleapis.com/v1/courses/${course.id}/courseWork`;
      const courseworkResponse = await fetch(courseworkUrl, {
        headers: {
          'Authorization': 'Bearer ' + token,
          'Content-Type': 'application/json'
        }
      });
      const courseworkData = await courseworkResponse.json();
      if (courseworkData.error) {
        console.error(`Error fetching coursework for course ${course.id}:`, courseworkData.error.message);
        continue;
      }
      const courseWorks = courseworkData.courseWork || [];
      assignments = assignments.concat(courseWorks);
    }
    return assignments;
  }
  
  function formatDueDate(dueDateObj) {
    // Formats a Classroom dueDate (object with year, month, day) as a string
    if (!dueDateObj || !dueDateObj.year || !dueDateObj.month || !dueDateObj.day) return null;
    return `${dueDateObj.year}-${String(dueDateObj.month).padStart(2, '0')}-${String(dueDateObj.day).padStart(2, '0')}`;
  }
  