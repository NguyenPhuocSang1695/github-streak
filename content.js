const USERNAME = "GITHUB_USERNAME"; // username của trên GitHub
const GITHUB_TOKEN = "PASTE_TOKEN_HERE"; // token

// 🔥 gọi GraphQL
async function fetchContributions() {
  const query = `
  {
    user(login: "${USERNAME}") {
      contributionsCollection {
        contributionCalendar {
          weeks {
            contributionDays {
              date
              contributionCount
            }
          }
        }
      }
    }
  }`;

  const res = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${GITHUB_TOKEN}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ query })
  });

  const json = await res.json();

  if (!json.data || !json.data.user) {
    console.error("❌ GraphQL error:", json);
    return [];
  }

  return json.data.user.contributionsCollection
    .contributionCalendar.weeks
    .flatMap(w => w.contributionDays);
}

// 🔥 tính streak (strict mode)
async function getStreak() {
  const days = await fetchContributions();

  const map = new Map();
  days.forEach(d => map.set(d.date, d.contributionCount));

  let streak = 0;
  let current = new Date();

  const getDateStr = (date) =>
    new Date(date.getTime() - date.getTimezoneOffset() * 60000)
      .toISOString()
      .split("T")[0];

  const today = getDateStr(current);

  // ❗ nếu hôm nay không có commit → reset
  if ((map.get(today) || 0) === 0) {
    console.log("❌ No contribution today → streak = 0");
    return 0;
  }

  // 👉 tính liên tiếp
  while (true) {
    const dateStr = getDateStr(current);
    const count = map.get(dateStr) || 0;

    console.log("Check:", dateStr, "→", count);

    if (count > 0) {
      streak++;
      current.setDate(current.getDate() - 1);
    } else break;
  }

  return streak;
}

// 🎨 render UI
function render(streak) {
  const header = document.querySelector("header");
  if (!header) return;

  let el = document.getElementById("streak-badge");

  if (el) {
    el.innerText = `🔥 ${streak}`;
    return;
  }

  el = document.createElement("div");
  el.id = "streak-badge";
  el.innerText = `🔥 ${streak}`;

  el.style.marginLeft = "12px";
  el.style.padding = "4px 10px";
  el.style.borderRadius = "999px";
  el.style.background = "#21262d";
  el.style.color = "#f78166";
  el.style.fontSize = "12px";
  el.style.display = "flex";
  el.style.alignItems = "center";
  el.style.fontWeight = "600";

  const search = document.querySelector('input[placeholder*="search"]');

  if (search && search.parentElement) {
    search.parentElement.parentElement.insertBefore(el, search.parentElement);
  } else {
    header.appendChild(el);
  }
}

// 🚀 init
async function init() {
  try {
    const streak = await getStreak();
    render(streak);
  } catch (e) {
    console.error("Error:", e);
  }
}

// chạy lần đầu
init();

// 🔁 update mỗi 1 phút (an toàn rate limit)
setInterval(init, 60000);