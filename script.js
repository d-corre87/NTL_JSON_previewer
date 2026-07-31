const fileInput = document.getElementById("jsonFile");
const fileName = document.getElementById("fileName");
const statusMessage = document.getElementById("status");
const listsContainer = document.getElementById("listsContainer");
const modifiedDate = document.getElementById("modifiedDate");

fileInput.addEventListener("change", handleFileSelection);

async function handleFileSelection(event) {
    const file = event.target.files[0];

    if (!file) {
        return;
    }

    fileName.textContent = file.name;
    setStatus("Reading JSON file...", "");

    try {
        const text = await file.text();
        const jsonData = JSON.parse(text);
        const periods = normalizeJson(jsonData);

        if (periods.length === 0) {
            throw new Error("No library-title lists were found in this JSON file.");
        }

        renderPeriods(periods);
        modifiedDate.textContent =
            "Preview generated: " + new Date().toLocaleDateString("en-CA");

        const totalTitles = periods.reduce(
            (total, period) => total + period.items.length,
            0
        );

        setStatus(
            `${periods.length} list${periods.length === 1 ? "" : "s"} and ` +
            `${totalTitles} title${totalTitles === 1 ? "" : "s"} loaded.`,
            "success"
        );
    } catch (error) {
        listsContainer.innerHTML =
            '<div class="empty-state">The file could not be displayed.</div>';
        modifiedDate.textContent = "";
        setStatus(error.message, "error");
    }
}

/*
    This function accepts several common JSON structures:

    1. A single array of title records.
    2. An array of period objects containing dates and a title array.
    3. An object containing three named date-range arrays.
    4. An object with a property such as periods, issues, lists, or data.

    This makes the preview useful even if the webmaster's wrapper field
    names change slightly.
*/
function normalizeJson(data) {
    if (isTitleArray(data)) {
        return [{
            label: "Titles in selected file",
            items: data
        }];
    }

    if (Array.isArray(data)) {
        return data
            .map((entry, index) => normalizePeriodObject(entry, index))
            .filter(Boolean);
    }

    if (!isPlainObject(data)) {
        return [];
    }

    const likelyContainers = ["periods", "issues", "lists", "data", "new_titles"];

    for (const key of likelyContainers) {
        if (Array.isArray(data[key])) {
            const normalized = normalizeJson(data[key]);

            if (normalized.length > 0) {
                return normalized;
            }
        }
    }

    const directPeriod = normalizePeriodObject(data, 0);

    if (directPeriod) {
        return [directPeriod];
    }

    const periods = [];

    for (const [key, value] of Object.entries(data)) {
        if (isTitleArray(value)) {
            periods.push({
                label: formatObjectKey(key),
                items: value
            });
        } else if (isPlainObject(value)) {
            const normalized = normalizePeriodObject(value, periods.length, key);

            if (normalized) {
                periods.push(normalized);
            }
        }
    }

    return periods;
}

function normalizePeriodObject(period, index, fallbackKey = "") {
    if (!isPlainObject(period)) {
        return null;
    }

    const arrayKeys = [
        "titles",
        "items",
        "records",
        "books",
        "resources",
        "entries",
        "list",
        "new_titles"
    ];

    let items = null;

    for (const key of arrayKeys) {
        if (isTitleArray(period[key])) {
            items = period[key];
            break;
        }
    }

    if (!items) {
        for (const value of Object.values(period)) {
            if (isTitleArray(value)) {
                items = value;
                break;
            }
        }
    }

    if (!items) {
        return null;
    }

    return {
        label: getPeriodLabel(period, index, fallbackKey),
        items
    };
}

function getPeriodLabel(period, index, fallbackKey) {
    const readyMadeLabel =
        period.label ||
        period.title ||
        period.period ||
        period.date_range ||
        period.dateRange ||
        period.display_date;

    if (readyMadeLabel) {
        return String(readyMadeLabel);
    }

    const start =
        period.period_start_date ||
        period.start_date ||
        period.startDate ||
        period.from;

    const end =
        period.period_end_date ||
        period.end_date ||
        period.endDate ||
        period.to;

    if (start && end) {
        return `${formatDate(start)} to ${formatDate(end)}`;
    }

    if (fallbackKey) {
        return formatObjectKey(fallbackKey);
    }

    return `List ${index + 1}`;
}

function isTitleArray(value) {
    return (
        Array.isArray(value) &&
        (value.length === 0 || value.every(isTitleRecord))
    );
}

function isTitleRecord(value) {
    if (!isPlainObject(value)) {
        return false;
    }

    return Boolean(
        value.call_number ||
        value.callNumber ||
        value.hyperlink ||
        value.description ||
        value.title ||
        value.text
    );
}

function isPlainObject(value) {
    return value !== null && typeof value === "object" && !Array.isArray(value);
}

function renderPeriods(periods) {
    listsContainer.innerHTML = "";

    periods.forEach((period, index) => {
        const details = document.createElement("details");
        details.className = "period";

        // Open the newest/first period automatically.
        if (index === 0) {
            details.open = true;
        }

        const summary = document.createElement("summary");

        const title = document.createElement("span");
        title.className = "period-title";
        title.textContent = period.label;

        const count = document.createElement("span");
        count.className = "item-count";
        count.textContent =
            `${period.items.length} title${period.items.length === 1 ? "" : "s"}`;

        summary.append(title, count);
        details.appendChild(summary);

        const list = document.createElement("ul");
        list.className = "titles-list";

        period.items.forEach(item => {
            list.appendChild(createTitleItem(item));
        });

        details.appendChild(list);
        listsContainer.appendChild(details);
    });
}

function createTitleItem(item) {
    const listItem = document.createElement("li");
    listItem.className = "title-item";

    const titleLine = document.createElement("p");
    titleLine.className = "title-line";

    const title = document.createElement("span");
    title.className = "title-text";
    title.textContent = getTitleText(item);

    titleLine.appendChild(title);

    const descriptionText = item.description || item.publication || "";

    if (descriptionText) {
        const description = document.createElement("span");
        description.className = "description";
        description.textContent = " " + descriptionText;
        titleLine.appendChild(description);
    }

    const callNumber = document.createElement("p");
    callNumber.className = "call-number";
    callNumber.textContent =
        item.call_number || item.callNumber || item.shelfmark || "";

   const links = document.createElement("p");
    links.className = "catalogue-links";

    links.innerHTML = `
        ${item.hyperlink?.url?.en
            ? `<a href="${item.hyperlink.url.en}" target="_blank" rel="noopener noreferrer">View in the catalogue</a>`
            : "No English URL"}
        &nbsp;|&nbsp;
        ${item.hyperlink?.url?.fr
            ? `<a href="${item.hyperlink.url.fr}" target="_blank" rel="noopener noreferrer">Consulter le catalogue</a>`
            : "No French URL"}
    `;

    listItem.append(
        titleLine,
        callNumber,
        links
    );

    return listItem;
}

function getTitleText(item) {
    if (item.hyperlink && item.hyperlink.text) {
        return item.hyperlink.text;
    }

    return item.title || item.text || "Untitled record";
}

function getEnglishUrl(item) {
    if (!item.hyperlink) {
        return item.url || "";
    }

    if (typeof item.hyperlink.url === "string") {
        return item.hyperlink.url;
    }

    return (
        item.hyperlink.url?.en ||
        item.hyperlink.url?.fr ||
        item.hyperlink.href ||
        ""
    );
}

function formatDate(value) {
    const text = String(value).trim();
    const date = new Date(text + (/^\d{4}-\d{2}-\d{2}$/.test(text) ? "T00:00:00" : ""));

    if (Number.isNaN(date.getTime())) {
        return text;
    }

    return date.toLocaleDateString("en-CA", {
        year: "numeric",
        month: "long",
        day: "numeric"
    });
}

function formatObjectKey(key) {
    return String(key)
        .replace(/[_-]+/g, " ")
        .replace(/\b\w/g, letter => letter.toUpperCase());
}

function setStatus(message, type) {
    statusMessage.textContent = message;
    statusMessage.className = "status";

    if (type) {
        statusMessage.classList.add(type);
    }
}
