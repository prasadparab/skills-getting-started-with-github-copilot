document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Fetch activities, render cards (with participants list), populate select, handle signup

  async function fetchActivities() {
    const res = await fetch("/activities");
    if (!res.ok) throw new Error("Failed to load activities");
    return await res.json();
  }

  function createParticipantList(participants) {
    if (!participants || participants.length === 0) {
      return `<div class="participants"><h5>Participants</h5><div class="none">No participants yet</div></div>`;
    }
    const items = participants
      .map((p) =>
        `<li><span class="p-email">${escapeHtml(p)}</span><button class="delete-btn" data-email="${escapeAttr(
          p
        )}" title="Unregister">🗑️</button></li>`
      )
      .join("");
    return `<div class="participants"><h5>Participants</h5><ul>${items}</ul></div>`;
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function renderActivities(activities) {
    activitiesList.innerHTML = "";
    activitySelect.querySelectorAll('option:not([value=""])').forEach((o) => o.remove());

    Object.keys(activities).forEach((name) => {
      const a = activities[name];
      const card = document.createElement("div");
      card.className = "activity-card";

      const title = document.createElement("h4");
      title.textContent = name;
      card.appendChild(title);

      const desc = document.createElement("p");
      desc.textContent = a.description;
      card.appendChild(desc);

      const sched = document.createElement("p");
      sched.innerHTML = `<strong>Schedule:</strong> ${escapeHtml(a.schedule)}`;
      card.appendChild(sched);

      const capacity = document.createElement("p");
      capacity.innerHTML = `<strong>Max participants:</strong> ${a.max_participants}`;
      card.appendChild(capacity);

      // Participants section (bulleted list)
      const participantsHtml = createParticipantList(a.participants);
      const wrapper = document.createElement("div");
      wrapper.innerHTML = participantsHtml;
      card.appendChild(wrapper);

      activitiesList.appendChild(card);

      // Add option to select
      const opt = document.createElement("option");
      opt.value = name;
      opt.textContent = name;
      activitySelect.appendChild(opt);
    });
  }

  // helper to escape attribute values
  function escapeAttr(str) {
    return String(str).replace(/"/g, '&quot;').replace(/'/g, "&#39;");
  }

  // Delegate delete clicks from the activities list
  activitiesList.addEventListener("click", async (event) => {
    const btn = event.target.closest(".delete-btn");
    if (!btn) return;
    const li = btn.closest("li");
    // find activity name from nearest card
    const card = btn.closest(".activity-card");
    if (!card) return;
    const activityName = card.querySelector("h4").textContent;
    const email = btn.dataset.email;
    if (!email) return;

    if (!confirm(`Unregister ${email} from ${activityName}?`)) return;

    try {
      const url = `/activities/${encodeURIComponent(activityName)}/participants?email=${encodeURIComponent(
        email
      )}`;
      const res = await fetch(url, { method: "DELETE" });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        const detail = body.detail || body.message || "Could not unregister";
        showMessage("error", detail);
        return;
      }
      showMessage("success", body.message || "Unregistered successfully");
      // remove the participant from the DOM quickly
      if (li) li.remove();
    } catch (err) {
      console.error(err);
      showMessage("error", "Network error while unregistering.");
    }
  });

  function showMessage(type, text) {
    messageDiv.className = "";
    messageDiv.classList.add("message");
    messageDiv.classList.add(type);
    messageDiv.textContent = text;
    messageDiv.classList.remove("hidden");
  }

  async function loadAndRender() {
    try {
      const activities = await fetchActivities();
      renderActivities(activities);
    } catch (err) {
      activitiesList.innerHTML = `<p class="error">Could not load activities.</p>`;
      console.error(err);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value.trim();
    const activity = document.getElementById("activity").value;
    if (!email || !activity) {
      showMessage("error", "Please provide an email and select an activity.");
      return;
    }

    try {
      const url = `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`;
      const res = await fetch(url, { method: "POST" });
      const body = await res.json();
      if (!res.ok) {
        const detail = body.detail || body.message || "Signup failed";
        showMessage("error", detail);
        return;
      }
      showMessage("success", body.message || "Signed up successfully");
      // Refresh activities to show updated participants
      await loadAndRender();
      signupForm.reset();
    } catch (err) {
      console.error(err);
      showMessage("error", "Network error during signup.");
    }
  });

  // Initialize app
  loadAndRender();
});
