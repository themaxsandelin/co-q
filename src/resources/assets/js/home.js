const createEventButton = document.getElementById('create-event-button');
if (createEventButton) createEventButton.addEventListener('click', toggleEventModal);

const cancelCreateEventButton = document.getElementById('cancel-create-event');
if (cancelCreateEventButton) cancelCreateEventButton.addEventListener('click', () => {
  toggleEventModal();
  resetEventModal();
});

let eventModal;
let eventFeedbackWrapper;
let eventFeedbackModal;
const eventModalContainer = document.getElementById('event-modal-container');
if (eventModalContainer) {
  eventModalContainer.addEventListener('click', () => {
    toggleEventModal();
  });

  eventModal = document.getElementById('event-modal');
  eventFeedbackWrapper = document.getElementById('event-feedback-wrapper');
  eventFeedbackModal = document.getElementById('event-feedback-modal');

  eventModal.addEventListener('click', (e) => {
    e.stopPropagation();
  });

  eventFeedbackModal.addEventListener('click', (e) => {
    e.stopPropagation();
  });
}

const vibeNodes = document.querySelectorAll('ul.vibe-list li');
for (let i = 0; i < vibeNodes.length; i++) {
  vibeNodes[i].addEventListener('click', selectVibe);
}



const createButton = document.getElementById('create-event');
if (createButton) createButton.addEventListener('click', initiateCreateEvent);

const eventTitle = document.getElementById('event-title');
if (eventTitle) eventTitle.addEventListener('input', titleInput);

const eventSlug = document.getElementById('event-slug');
if (eventSlug) eventSlug.addEventListener('input', slugInput);

const slugPreview = document.getElementById('slug-preview');
updateSlugPreview();

const closeEventButton = document.getElementById('close-event-feedback');
if (closeEventButton) closeEventButton.addEventListener('click', toggleEventModal);

function generateSlugFromTitle(title) {
  while (title.indexOf(' ') > -1) {
    title = title.replace(' ', '-');
  }
  title = title.replace(/[^0-9a-z-]/gi, '');
  title = title.toLowerCase();
  return title;
}

function updateSlugPreview() {
  if (slugPreview) slugPreview.innerText = window.location.protocol + '//' + window.location.host + '/event/' + eventSlug.value;
}

let slugAutomated = true;
function titleInput() {
  if (!slugAutomated) return;

  eventSlug.value = generateSlugFromTitle(this.value);
  updateSlugPreview();
}

function slugInput() {
  let slug = this.value;
  if (slug) {
    slugAutomated = false;
  } else {
    this.value = generateSlugFromTitle(eventTitle.value);
    slugAutomated = true;
  }
  updateSlugPreview();
}

function initiateCreateEvent() {
  const title = eventTitle.value;
  const slug = eventSlug.value;
  const description = document.getElementById('event-description').value;
  const vibe  = selectedVibe;
  const password = document.getElementById('event-password').value;

  fetch('/create-event', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    credentials: 'include',
    body: JSON.stringify({
      title: title,
      slug: slug,
      description: description,
      vibe: vibe,
      password: password
    })
  }).then((response) => response.json()).then((json) => {
    if (json.error) {
      console.log(json.error);
      return alert(json.error);
    }

    showCreationFeedback(json);
  }).catch((error) => {
    console.log('Fetch error: ' + error);
  });
}

let selectedVibe;
function selectVibe() {
  const selected = document.querySelector('ul.vibe-list li.selected');
  if (selected) selected.classList.remove('selected');

  selectedVibe = vibes[this.innerText];
  this.classList.add('selected');
}

function resetEventModal() {
  selectedVibe = null;
  eventTitle.value = '';
  eventSlug.value = '';
  document.getElementById('event-description').value = '';
  document.getElementById('event-password').value = '';

  const selected = document.querySelector('ul.vibe-list li.selected');
  if (selected) selected.classList.remove('selected');
}

let eventModalAnimating = false;
let eventModalVisible = false;
let eventFeedbackVisible = false;
function toggleEventModal() {
  if (eventModalAnimating) return;

  if (eventFeedbackVisible) {
    eventModalAnimating = true;
    eventFeedbackWrapper.classList.remove('show');
    eventModal.classList.remove('hide');
    eventModalContainer.classList.remove('show');
    eventModalContainer.classList.add('forceModal');
    setTimeout(() => {
      eventFeedbackWrapper.classList.remove('display');
      eventModalContainer.classList.remove('display');
      eventModalContainer.classList.remove('forceModal');
      setTimeout(() => {
        eventFeedbackVisible = false;
        eventModalVisible = false;
        eventModalAnimating = false;
      }, 20);
    }, 400);
  } else {
    if (!eventModalVisible) {
      eventModalContainer.classList.add('display');
      setTimeout(() => {
        eventModalContainer.classList.add('show');
        setTimeout(() => {
          // Done
        }, 400);
      }, 20);
    } else {
      eventModalContainer.classList.remove('show');
      setTimeout(() => {
        eventModalContainer.classList.remove('display');
        setTimeout(() => {
          // Done
        }, 20);
      }, 400);
    }
  }

  if (!eventFeedbackVisible) {
    eventModalAnimating = true;

    setTimeout(() => {
      eventModalAnimating = false;
      eventModalVisible = !eventModalVisible;
    }, 420);
  }
}

function showCreationFeedback(event) {
  eventModalAnimating = true;
  eventFeedbackVisible = true;

  document.getElementById('event-url').value = event.url;
  document.getElementById('event-button-link').href = event.url;
  pushEventToList(event);

  eventFeedbackWrapper.classList.add('display');
  setTimeout(() => {
    eventModal.classList.add('hide');
    eventFeedbackWrapper.classList.add('show');
    setTimeout(() => {
      eventModalAnimating = false;
    }, 400);
  }, 20);
}

function pushEventToList(event) {
  const list = document.getElementById('author-events');

  const item = document.createElement('li');
  const link = document.createElement('a');
  link.href = event.url;
  item.appendChild(link);

  const title = document.createElement('h3');
  title.innerText = event.title;
  link.appendChild(title);

  const meta = document.createElement('div');
  meta.classList.add('meta');
  link.appendChild(meta);

  const author = document.createElement('p');
  author.innerHTML = 'Author: <span>' + event.author.name + '</span>';
  meta.appendChild(author);

  const attendees = document.createElement('p') ;
  attendees.innerHTML = 'Attendees: <span>' + event.attendeeCount + '</span>';
  meta.appendChild(attendees);

  const description = document.createElement('p');
  description.innerText = event.description;
  link.appendChild(description);

  list.appendChild(item);
}
