
export interface Updater {
	start(): void;
	stop(): void;
}

export class ProgressStatusBar implements Updater {
	el: HTMLElement;
	currentInterval: number;
	msg: string;
	duration: number;
	runs: 0;

	constructor(el: HTMLElement, msg = "Transcribing ", duration: number = 1000) {
		this.el = el;
		this.duration = duration;
		this.msg = msg;
	}

	setMsg(m:string) {
		this.msg = m
	}

	start() {
		this.runs = 0;
		this.currentInterval = setInterval(()=> {
			this.runs += 1;
			let currentIcon = `${this.msg} `;
			switch(this.runs % 4) {
				case 0:
					currentIcon += '|';
					break;
				case 1:
					currentIcon += '/';
					break;
				case 2:
					currentIcon += '-';
					break;
				case 3:
					currentIcon += "\\";
					break;
				default:
					currentIcon += '';
			}
		    this.el.setText(currentIcon);
		},this.duration)
	}
	stop() {
		clearInterval(this.currentInterval);
		this.el.setText('');
	}
}
