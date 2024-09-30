export function getFilename(selection: string): string {
	const match = /!?\[\[(.*?\.webm)\]\]/.exec(selection);
	if (match) {
		return match[1];
	}
	return '';
}

export function trimResourcePath(path: string): string {
	const qIndex = path.indexOf('?');
	let result = path;
	if(qIndex > -1) {
		result = result.slice(0,qIndex);
	}
	result = result.replace(/app:\/\/([a-f,0-9])+/,'');
	result = decodeURIComponent(result);
	return result;

}