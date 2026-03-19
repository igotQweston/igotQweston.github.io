const formatRelativeTime = (input) => {
	const timestamp = new Date(input);

	if (Number.isNaN(timestamp.getTime())) {
		return null;
	}

	const secondsAgo = Math.max(0, Math.floor((Date.now() - timestamp.getTime()) / 1000));

	if (secondsAgo < 3600) {
		return `${Math.floor(secondsAgo / 60)}m ago`;
	}

	if (secondsAgo < 86400) {
		return `${Math.floor(secondsAgo / 3600)}h ago`;
	}

	if (secondsAgo < 2592000) {
		return `${Math.floor(secondsAgo / 86400)}d ago`;
	}

	if (secondsAgo < 31536000) {
		return `${Math.floor(secondsAgo / 2592000)}mo ago`;
	}

	const datePart = timestamp.toLocaleDateString(undefined, {
		year: "numeric",
		month: "short",
		day: "numeric",
	});
	const timePart = timestamp.toLocaleTimeString(undefined, {
		hour: "numeric",
		minute: "2-digit",
		hour12: true,
	});

	return `${datePart} - ${timePart}`;
};

const updateRelativeTimes = () => {
	document.querySelectorAll(".js-relative-time").forEach((element) => {
		const value = element.dataset.relativeTime;
		const label = formatRelativeTime(value);

		if (label) {
			element.textContent = label;
		}
	});
};

// Auto-embed URLs in status content
const embedUrls = async () => {
	const pathname = window.location.pathname;
	if (!pathname.includes("/status/")) return;

	const contentElement = document.querySelector(".e-content");
	if (!contentElement) return;

	// Find all plain URLs in text (not already wrapped in <a> tags)
	const urlRegex = /(?<!href="|<a [^>]*>)https?:\/\/[^\s<>]+/g;
	const walker = document.createTreeWalker(
		contentElement,
		NodeFilter.SHOW_TEXT,
		null,
		false
	);

	const nodesToProcess = [];
	let node;
	while ((node = walker.nextNode())) {
		const parentElement = node.parentElement;
		if (parentElement?.closest("a, .link-embed, .js-embed-source-link")) {
			continue;
		}

		if (urlRegex.test(node.nodeValue)) {
			nodesToProcess.push(node);
		}
	}

	for (const textNode of nodesToProcess) {
		const urls = Array.from(textNode.nodeValue.matchAll(/(https?:\/\/[^\s<>]+)/g));
		if (urls.length === 0) continue;

		const fragment = document.createDocumentFragment();
		let lastIndex = 0;

		for (const match of urls) {
			const url = match[0];
			const beforeText = textNode.nodeValue.substring(lastIndex, match.index);
			if (beforeText) fragment.appendChild(document.createTextNode(beforeText));

			// Create embed card for each URL
			const embedCard = document.createElement("div");
			embedCard.className = "link-embed card mt-3 mb-3";
			embedCard.innerHTML = `
				<div class="card-body">
					<a href="${url}" target="_blank" rel="noopener noreferrer" class="stretched-link">
						<div class="text-muted small">${new URL(url).hostname}</div>
						<div class="link-title fw-semibold">${url}</div>
					</a>
				</div>
			`;
			fragment.appendChild(embedCard);

			// Add a plain link below the embed
			const linkElement = document.createElement("a");
			linkElement.href = url;
			linkElement.target = "_blank";
			linkElement.rel = "noopener noreferrer";
			linkElement.textContent = url;
			linkElement.className = "d-block mt-2 mb-3 js-embed-source-link";
			fragment.appendChild(linkElement);

			// Fetch metadata from microlink service
			fetch(`https://api.microlink.io?url=${encodeURIComponent(url)}`)
				.then((res) => res.json())
				.then((data) => {
					if (data.data) {
						const { title, description, image } = data.data;
						const body = embedCard.querySelector(".card-body");
						body.innerHTML = `
							<a href="${url}" target="_blank" rel="noopener noreferrer" class="stretched-link text-decoration-none text-body">
								${image ? `<img src="${image.url}" alt="" class="img-fluid rounded mb-2" style="max-height: 200px; object-fit: cover;">` : ""}
								<div class="text-muted small">${new URL(url).hostname}</div>
								${title ? `<div class="link-title fw-semibold">${title}</div>` : ""}
								${description ? `<div class="text-muted small">${description.substring(0, 100)}${description.length > 100 ? "…" : ""}</div>` : ""}
							</a>
						`;
					}
				})
				.catch(() => {}); // Silent fail if fetch doesn't work

			lastIndex = match.index + match[0].length;
		}

		const afterText = textNode.nodeValue.substring(lastIndex);
		if (afterText) fragment.appendChild(document.createTextNode(afterText));

		textNode.parentNode.replaceChild(fragment, textNode);
	}
};

updateRelativeTimes();
window.setInterval(updateRelativeTimes, 60000);
embedUrls();
