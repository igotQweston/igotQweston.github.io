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

	return `${Math.floor(secondsAgo / 31536000)}y ago`;
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

updateRelativeTimes();
window.setInterval(updateRelativeTimes, 60000);
