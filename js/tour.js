class WarningTour {
	constructor() {
		this.isTouring = false;
		this.currentWarningIndex = 0;
		this.currentLoopCount = 0;
		this.shouldContinue = true;
		this.sceneTimeout = null;
		this.checkInterval = 1000;
		this.warningDuration = 5000;
		this.sortedWarnings = [];
		document.querySelector('#start-scene-tour-button').addEventListener('click', () => this.startTour());
	}

	getSortedWarnings() {
		const priority = { Warning: 0, Watch: 1, Advisory: 2, Statement: 3 };
		return (window.cooperdarAlerts || []).filter((alert) => alert.geometry).sort((first, second) => (priority[first.properties.severity] ?? 4) - (priority[second.properties.severity] ?? 4));
	}

	startTour() {
		console.log('startTour called');
		if (this.isTouring) this.stopSceneTour();
		this.isTouring = true;
		this.currentWarningIndex = 0;
		this.currentLoopCount = 0;
		this.shouldContinue = true;
		this.startSceneTour();
	}

	startSceneTour() {
		this.sortedWarnings = this.getSortedWarnings();
		if (this.sortedWarnings.length > 0) {
			this.cycleWarning();
			return;
		}
		if (this.currentLoopCount < 3 && this.shouldContinue) {
			this.currentLoopCount += 1;
			this.sceneTimeout = setTimeout(() => this.startSceneTour(), this.checkInterval);
			return;
		}
		this.stopSceneTour();
	}

	cycleWarning() {
		if (!this.isTouring || !this.sortedWarnings.length) return;
		const warning = this.sortedWarnings[this.currentWarningIndex];
		if (window.cooperdarSelectAlert) window.cooperdarSelectAlert(warning);
		this.currentWarningIndex = (this.currentWarningIndex + 1) % this.sortedWarnings.length;
		this.sceneTimeout = setTimeout(() => {
			this.sortedWarnings = this.getSortedWarnings();
			this.cycleWarning();
		}, this.warningDuration);
	}

	stopSceneTour() {
		this.shouldContinue = false;
		this.isTouring = false;
		clearTimeout(this.sceneTimeout);
		document.querySelector('#alert-info').classList.remove('is-hidden');
	}
}

window.warningTour = new WarningTour();
