Dropzone.autoDiscover = false;
const url = `/promotions/${slug}/upload-picture`;
const myDropzone = new Dropzone("div#dropzoneArea", { url });
myDropzone.on('success', (file, response) => {
    console.log(response);
});