const createButton = document.getElementById('create-event');
if (createButton) createButton.addEventListener('click', initiateCreateEvent);

const eventTitle = document.getElementById('event-title');
if (eventTitle) eventTitle.addEventListener('input', titleInput);

const eventSlug = document.getElementById('event-slug');
if (eventSlug) eventSlug.addEventListener('input', slugInput);

const slugPreview = document.getElementById('slug-preview');
updateSlugPreview();

function generateSlugFromTitle(title) {
  title = title.replace(' ', '-');
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
  const vibe  = vibes[document.getElementById('event-vibe').value];
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
    console.log(json);
  }).catch((error) => {
    console.log('Fetch error: ' + error);
  });
}
