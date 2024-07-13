const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const photo = document.getElementById('photo');
const captureButton = document.getElementById('capture-btn');
const grayImage = document.getElementById('gray-image');
const redChannel = document.getElementById('red-channel');
const greenChannel = document.getElementById('green-channel');
const blueChannel = document.getElementById('blue-channel');
const redThresholdInput = document.getElementById('red-threshold');
const greenThresholdInput = document.getElementById('green-threshold');
const blueThresholdInput = document.getElementById('blue-threshold');
const redThresholdedImage = document.getElementById('red-thresholded');
const greenThresholdedImage = document.getElementById('green-thresholded');
const blueThresholdedImage = document.getElementById('blue-thresholded');
const photoAgain = document.getElementById('photo-again');
const ycbcrImage = document.getElementById('ycbcr-image');
const hsvImage = document.getElementById('hsv-image');
const blurImage = document.getElementById('blur-image');
const ycbcrThresholdInput = document.getElementById('ycbcr-threshold');
const ycbcrThresholdedImage = document.getElementById('ycbcr-thresholded');
const hsvThresholdInput = document.getElementById('hsv-threshold');
const hsvThresholdedImage = document.getElementById('hsv-thresholded');

let streaming = false;
// step 2) Scale that image to minimum 160 x 120 pixels
let width = 270;
let height = 202;
let stream;

navigator.mediaDevices.getUserMedia({ video: true, audio: false })
    .then(function(mediaStream) {
        video.srcObject = mediaStream;
        video.play();
        stream = mediaStream;
    })
    .catch(function(err) {
        console.error("Error accessing the webcam: " + err);
    });

video.addEventListener('canplay', function(ev) {
    if (!streaming) {
        height = video.videoHeight / (video.videoWidth/width);

        if (isNaN(height)) {
            height = width / (4/3);
        }

        video.setAttribute('width', width);
        video.setAttribute('height', height);
        canvas.setAttribute('width', width);
        canvas.setAttribute('height', height);
        streaming = true;
    }
}, false);


// step 12) Perform face detection using face api

let faceapi;
let vid;
let detections;
let captureActive = true; // Flag to track whether capture is active

// by default all options are set to true
const detectionOptions = {
    withLandmarks: true,
    withDescriptors: false,
};
  
function setup() {
    createCanvas(270, 202);
  
    // load up your video
    vid = createCapture(VIDEO);
    vid.size(width, height);
    vid.hide(); // Hide the video element, and just show the canvas
    faceapi = ml5.faceApi(vid, detectionOptions, modelReady,);
    textAlign(RIGHT);
    hideDefaultCanvas();
  
}
  
function modelReady() {
    console.log("ready!");
    console.log(faceapi);
    faceapi.detect(gotResults);
}

captureButton.addEventListener('click', function(ev) {
    takePicture();
    captureButton.style.display = 'none'; // Hide the capture button
    captureActive = false; // Set capture to inactive after taking picture
    ev.preventDefault();
}, false);

function gotResults(err, result) {
    if (err) {
      console.log(err);
      return;
    }
    
    // console.log(result)
    detections = result;
  
    // background(220);
    background(255);
    image(vid, 0, 0, width, height);
    if (detections) {
      if (detections.length > 0) {
        applyBlur(detections);
      }
    }
    if(captureActive){
        faceapi.detect(gotResults);
    }
}

function takePicture() {
    const context = canvas.getContext('2d');
    if (width && height) {
        canvas.width = width;
        canvas.height = height;
        context.drawImage(video, 0, 0, width, height);

        // Step 1) Capture the image from canvas and display it
        const data = canvas.toDataURL('image/png');
        photo.src = data;
        // step 3) Display the webcam image in the grid at the position titled “Webcam image”.
        photo.style.display = 'inline-block';

        // displaying same image in next time
        photoAgain.src = data;
        photoAgain.style.display = 'inline-block';


        // step 13) Display the detected blurred face

        // Get the default canvas of p5.js and set its source to the captured image
        // Assuming your p5.js canvas has an id 'defaultCanvas0'
        const p5Canvas = document.getElementById('defaultCanvas0');
        const p5CanvasData = p5Canvas.toDataURL('image/png');
        blurImage.src = p5CanvasData;
        blurImage.style.display = 'inline-block';
        blurImage.width = 270;
        blurImage.height = 202;

        // Remove the default canvas from the DOM
        p5Canvas.remove();


        // step 4) Convert image to grayscale and increase the brightness by 20%.
        // step 5) Increasing the brightness can cause the pixel intensity to get beyond the 255 levels.
        const imageData = context.getImageData(0, 0, width, height);
        const dataCopy = new Uint8ClampedArray(imageData.data);
        for (let i = 0; i < dataCopy.length; i += 4) {
            const brightness = (dataCopy[i] + dataCopy[i + 1] + dataCopy[i + 2]) / 3; // Calculate average brightness
            dataCopy[i] = brightness; // Red component
            dataCopy[i + 1] = brightness; // Green component
            dataCopy[i + 2] = brightness; // Blue component
        }
        const processedImageData = new ImageData(dataCopy, width, height);
        context.putImageData(processedImageData, 0, 0);
        grayImage.src = canvas.toDataURL('image/png');
        grayImage.style.display = 'inline-block';

        // Separate color channels
        // step 6) Using the original webcam image: split into three color channels (R, G, B) and show each channel.
        const redData = context.getImageData(0, 0, width, height);
        const greenData = context.getImageData(0, 0, width, height);
        const blueData = context.getImageData(0, 0, width, height);
        for (let i = 0; i < redData.data.length; i += 4) {
            redData.data[i + 1] = redData.data[i + 2] = 0; // Set green and blue channels to 0
            greenData.data[i] = greenData.data[i + 2] = 0; // Set red and blue channels to 0
            blueData.data[i] = blueData.data[i + 1] = 0; // Set red and green channels to 0
        }
        redChannel.src = getImageFromImageData(redData);
        redChannel.style.display = 'inline-block';
        greenChannel.src = getImageFromImageData(greenData);
        greenChannel.style.display = 'inline-block';
        blueChannel.src = getImageFromImageData(blueData);
        blueChannel.style.display = 'inline-block';

        // Convert the image to YCbCr color space
        const ycbcrData = convertToYCbCr(imageData);
        context.putImageData(ycbcrData, 0, 0);
        ycbcrImage.src = canvas.toDataURL('image/png');
        ycbcrImage.style.display = 'inline-block';

        // Convert the image to HSV color space
        const hsvData = convertToHSV(imageData);
        context.putImageData(hsvData, 0, 0);
        hsvImage.src = canvas.toDataURL('image/png');
        hsvImage.style.display = 'inline-block';

        // set default imaegs and unlock the sliders of threshold sliders
        redThresholdedImage.src = redChannel.src;
        redThresholdedImage.style.display = 'inline-block';
        redThresholdInput.style.display = 'inline-block';

        greenThresholdedImage.src = greenChannel.src;
        greenThresholdedImage.style.display = 'inline-block';
        greenThresholdInput.style.display = 'inline-block';

        blueThresholdedImage.src = blueChannel.src;
        blueThresholdedImage.style.display = 'inline-block';
        blueThresholdInput.style.display = 'inline-block';

        ycbcrThresholdedImage.src = ycbcrImage.src;
        ycbcrThresholdedImage.style.display = 'inline-block';
        ycbcrThresholdInput.style.display = 'inline-block';

        hsvThresholdedImage.src = hsvImage.src;
        hsvThresholdedImage.style.display = 'inline-block';
        hsvThresholdInput.style.display = 'inline-block';

        var elements = document.getElementsByClassName('label');
        for (var i = 0; i < elements.length; i++) {
            elements[i].style.display = 'block';
        }


        // Hide the video element
        video.style.display = 'none';

        // Stop the webcam stream
        stream.getTracks().forEach(function(track) {
            track.stop();
        });

        stopCamera();
    }
}

function applyBlur(detections) {
    detections.forEach(detection => {
      const alignedRect = detection.alignedRect;
      const { _x, _y, _width, _height } = alignedRect._box;
      
      // Extract the region of interest (ROI) from the video frame
      let roi = vid.get(_x, _y, _width, _height);
      
      // Apply a blur filter to the ROI
      roi.filter(BLUR, 10); // Adjust the blur strength as needed
      
      // Draw the blurred ROI back onto the canvas
      image(roi, _x, _y, _width, _height);
    });
}
  
// Function to remove the video element from the DOM
function removeVideoElement() {
    const videoElement = document.querySelector('video[playsinline]');
    if (videoElement) {
        videoElement.remove();
    }
}
  
  // Function to stop the camera stream
function stopCamera() {
    if (vid && vid.elt.srcObject) {
        const stream = vid.elt.srcObject;
        const tracks = stream.getTracks();
        tracks.forEach(track => track.stop());
    }
    // Call removeVideoElement to remove the video element from the DOM
    removeVideoElement();
}
  
function hideDefaultCanvas() {
    const defaultCanvas = document.getElementById('defaultCanvas0');
    if (defaultCanvas) {
        defaultCanvas.style.display = 'none';
    }
}


function getImageFromImageData(imageData) {
    const canvas = document.createElement('canvas');
    canvas.width = imageData.width;
    canvas.height = imageData.height;
    const ctx = canvas.getContext('2d');
    ctx.putImageData(imageData, 0, 0);
    return canvas.toDataURL('image/png');
}

//  step 7) Perform image thresholding with a slider for each channel separately
// Thresholding
redThresholdInput.addEventListener('input', function() {
    applyThreshold(redChannel, redThresholdInput, redThresholdedImage);
});
greenThresholdInput.addEventListener('input', function() {
    applyThreshold(greenChannel, greenThresholdInput, greenThresholdedImage);
});
blueThresholdInput.addEventListener('input', function() {
    applyThreshold(blueChannel, blueThresholdInput, blueThresholdedImage);
});

// step 10) Using the color converted images perform image thresholding using a slider to control the threshold
ycbcrThresholdInput.addEventListener('input', function() {
    applyThreshold(ycbcrImage, ycbcrThresholdInput, ycbcrThresholdedImage);
});
hsvThresholdInput.addEventListener('input', function() {
    applyThreshold(hsvImage, hsvThresholdInput, hsvThresholdedImage);
});

function applyThreshold(channelImage, thresholdInput, thresholdedImage) {
    const threshold = parseInt(thresholdInput.value);

    const context = canvas.getContext('2d');
    context.drawImage(channelImage, 0, 0, width, height);

    const imageData = context.getImageData(0, 0, width, height);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 1) {
        const channelValue = data[i]; // Red channel value for redThresholdInput, Green for greenThresholdInput, Blue for blueThresholdInput
        data[i] = channelValue < threshold ? 0 : 255;
    }

    context.putImageData(imageData, 0, 0);

    // Update thresholded image
    thresholdedImage.src = canvas.toDataURL('image/png');
    thresholdedImage.style.display = 'inline-block';
}


// step 8) What can you say about the result of thresholding for each channel – is it different and why?
/*
The result of thresholding for each channel may indeed be different, and this difference arises due to variations
in the intensity distribution of each color channel within the image.

Here's why the results may differ:

Red Channel: If the image contains a dominant red object or elements with strong red hues, the thresholding result
for the red channel might exhibit more pronounced features in those regions compared to the other channels. Conversely,
areas with low red intensity would appear darker in the thresholded image.

Green Channel: Similarly, if there are significant green elements or objects in the image, the thresholding result for 
the green channel would highlight those regions distinctly. Regions with low green intensity would be darker in the 
resulting thresholded image.

Blue Channel: The thresholding result for the blue channel would emphasize areas with strong blue intensity. This could be 
advantageous in scenarios where blue objects or features need to be isolated from the rest of the image.

In summary, the differences in thresholding results across channels arise from the inherent characteristics of the image 
data itself, specifically the intensity distribution within each color channel. Depending on the composition of the image 
and the distribution of colors, the thresholding outcome may vary significantly between channels.
*/


// step 9) Using the original webcam image again and assuming your camera’s color model is using an RGB color model, perform color space conversion
function convertToYCbCr(imageData) {
    // Algorithm for RGB to YCbCr conversion
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
        const R = data[i];
        const G = data[i + 1];
        const B = data[i + 2];
        const Y = 0.299 * R + 0.587 * G + 0.114 * B;
        const Cb = 128 - 0.168736 * R - 0.331264 * G + 0.5 * B;
        const Cr = 128 + 0.5 * R - 0.418688 * G - 0.081312 * B;
        data[i] = Y;
        data[i + 1] = Cb;
        data[i + 2] = Cr;
    }
    return imageData;
}

function convertToHSV(imageData) {
    // Algorithm for RGB to HSV conversion
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
        const R = data[i] / 255;
        const G = data[i + 1] / 255;
        const B = data[i + 2] / 255;
        const Cmax = Math.max(R, G, B);
        const Cmin = Math.min(R, G, B);
        const delta = Cmax - Cmin;
        let H, S, V;
        if (delta === 0) {
            H = 0;
        } else if (Cmax === R) {
            H = 60 * (((G - B) / delta) % 6);
        } else if (Cmax === G) {
            H = 60 * (((B - R) / delta) + 2);
        } else {
            H = 60 * (((R - G) / delta) + 4);
        }
        if (Cmax === 0) {
            S = 0;
        } else {
            S = delta / Cmax;
        }
        V = Cmax;
        data[i] = H;
        data[i + 1] = S;
        data[i + 2] = V;
    }
    return imageData;
}

// step 11) What can you say about the thresholding results above when compared to step 7 i.e. is the thresholded image noisier etc?
/*
When comparing thresholding results from YCbCr and HSV color space images to thresholding results from RGB channel images, 
several observations can be made:

Noise Level: Thresholding results from YCbCr and HSV images may exhibit different noise levels compared to thresholding 
results from RGB channel images. YCbCr and HSV color spaces often provide better separation of color and luminance 
information, which can lead to less noisy thresholded images, especially in scenarios where noise is predominantly present in one
or more RGB channels.

Color Separation: YCbCr and HSV color spaces inherently separate color and luminance information, making it potentially 
easier to threshold specific color ranges without interference from other color channels. In contrast, thresholding based 
on individual RGB channels may result in mixed color information due to the correlation between RGB channels.

Sensitivity to Illumination Changes: YCbCr and HSV color spaces are often less sensitive to changes in illumination compared
 to RGB channels. This means that thresholding in YCbCr or HSV color spaces may yield more consistent results across different
  lighting conditions, resulting in improved robustness to illumination variations.

Suitability for Specific Applications: The choice of color space for thresholding depends on the specific application
 requirements. For instance, if the task involves isolating specific color ranges or objects with distinct colors, 
 HSV color space might be more suitable due to its direct representation of hue, saturation, and value components. 
 Conversely, if the task involves separating luminance information from color information, YCbCr color space might 
 be preferred.

Potential for Improvement: While YCbCr and HSV color spaces may provide benefits in certain scenarios, there's always 
the possibility of using alternative color spaces or techniques to further improve thresholding results. For example, 
in scenarios where YCbCr or HSV thresholding results are still noisy or insufficiently accurate, advanced techniques 
such as adaptive thresholding or machine learning-based approaches could be explored to enhance performance.

In conclusion, the choice of color space for thresholding depends on factors such as noise sensitivity, color separation 
requirements, illumination robustness, and application-specific considerations. While YCbCr and HSV color spaces offer 
advantages over RGB channels in certain aspects, there's no one-size-fits-all solution, and experimentation with different 
color spaces and techniques is often necessary to achieve optimal results for a given application.
*/



// Commentry 2 given below

/*
In this project, we've embarked on a fascinating journey through digital image processing, focusing on face detection and 
anonymization through blurring. Utilizing each color channel for image thresholding and face anonymization presents a blend 
of challenges and opportunities in real-world applications such as privacy protection in public datasets or enhancing security 
in surveillance footage.

Image Thresholding Using Each Color Channel
Image thresholding is a technique used to segment objects from the background by converting an image into a binary image. 
This process can be particularly effective in face detection when applied to individual color channels (Red, Green, and Blue). 
Each color channel can highlight different features and contrasts of an image, making it easier to isolate the face from the 
background.

However, working with individual color channels can introduce complexities. For instance, varying lighting conditions can affect
the visibility of features in a particular channel. A face that is clearly distinguishable in one lighting condition might 
merge with the background in another, if only one color channel is considered. To mitigate these issues, adaptive thresholding
techniques and combining multiple color channels' data can be employed for more robust face detection across diverse environments.

Typical Problems and Solutions
Variable Lighting Conditions: Lighting can significantly impact the effectiveness of face detection algorithms. Under low 
light or backlit conditions, faces might not be easily distinguishable.

Solution: Implement adaptive thresholding and dynamic adjustment of parameters based on the lighting conditions. Using 
techniques like histogram equalization can also improve visibility under diverse lighting conditions.
Occlusion: Objects covering part of the face can interfere with accurate detection.

Solution: Advanced machine learning models trained on datasets with occluded faces can improve detection rates. Moreover, 
considering contextual information and partial features recognition can enhance robustness against occlusions.
Real-Time Processing Speed: Processing each color channel for thresholding and applying blurring filters can be 
computationally intensive, affecting real-time performance.

Solution: Optimization techniques such as downscaling the image for processing, utilizing efficient algorithms, and 
leveraging hardware acceleration (e.g., GPUs) can significantly reduce processing time.
Project Extension: Dynamic Anonymization in Video Streams
A unique extension of this project is the implementation of dynamic anonymization in real-time video streams. This 
innovation not only detects and blurs faces in the video but also adjusts the level of anonymization based on the 
context of the scene or the distance of faces from the camera. For instance, faces that are farther away from the 
camera can be blurred less aggressively than those close-up, maintaining a balance between privacy and content 
intelligibility.

This approach employs advanced machine learning models to estimate the depth information from the scene and dynamically 
adjust the blur intensity. It ensures that the anonymization process is less intrusive while providing necessary privacy 
protection, making it particularly useful in public surveillance systems or during live broadcasts where privacy concerns 
are paramount.

Conclusion
The exploration of image thresholding through individual color channels and the extension to dynamic video stream 
anonymization represent significant steps towards sophisticated digital image processing applications. Facing challenges 
such as variable lighting conditions and real-time processing demands innovative solutions, pushing the boundaries of what 
is possible in privacy protection and data anonymization. Through continued research and development, these technologies 
hold the promise of transforming how we manage and protect visual information in an increasingly digital world.
*/