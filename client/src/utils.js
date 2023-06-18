export const truncateStr = (str, n) => (str.length > n) ? str.substr(0, n - 1) + '...' : str;

export const getLocation = () => new Promise((resolve, reject) => {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(position => {
            resolve([position.coords.longitude, position.coords.latitude]);
        }, err => reject(err));
    } else reject("Geolocation is not supported by this browser.");
});

export const createFileFromURL = async url => {
    try {
        const response = await fetch('https://upload.wikimedia.org/wikipedia/commons/thumb/f/f7/Lemon_-_whole_and_split.jpg/750px-Lemon_-_whole_and_split.jpg');
        const data = await response.blob();
        return new File([data], url.split("/").at(-1));
    }
    catch (err) { console.log(err); };
}