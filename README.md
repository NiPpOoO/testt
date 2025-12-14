# WebAR Tutorial

This project is a simple guide to help you set up a WebAR experience using [Google's Model Viewer](https://modelviewer.dev/). 
It includes step-by-step instructions to host your 3D models (GLB for Android and USDZ for iOS) on GitHub Pages.

You can **[Test this app here]**: (https://gunteralce.github.io/webar-tutorial/)

---

## Features
- **Cross-platform AR:** Supports Android (GLB) and iOS (USDZ) 3D models.
- **GitHub Pages Deployment:** Easily host your WebAR experience online.
- **Customizable Design:** Modify the `index.html` and `style.css` files to personalize your page.

---

## Prerequisites
Before starting, make sure you have:
1. A [GitHub account](https://github.com/). If you don't have one, sign up [here](https://github.com/join).
2. A 3D model:
   - GLB format (for Android devices).
   - USDZ format (for iOS devices).  
   Download free models from [Poly Pizza](https://polypizza.com/), [Sketchfab](https://sketchfab.com/), or create your own.

---


## Quick Start Guide

### 1. Fork This Repository
Click the "Fork" button in the top-right corner to create a copy of this repository in your GitHub account.

---

### 2. Clone Your Repository
Clone the forked repository to your local machine:
```bash
git clone https://github.com/<your-username>/webar-tutorial.git
cd webar-tutorial

### 3. Add Your 3D Models
Upload your GLB and USDZ files into the repository. Replace the file paths in the index.html file with your model's filenames:
```bash
src="https://raw.githubusercontent.com/<your-username>/webar-tutorial/main/your-model.glb"
ios-src="https://raw.githubusercontent.com/<your-username>/webar-tutorial/main/your-model.usdz"
```

---

### 4. Publish with GitHub Pages
1. Go to Settings in your repository.
2. Scroll down to GitHub Pages.
3. Under Branch, select main and click Save.
4. Your WebAR page will be published at:
```bash
https://<your-username>.github.io/webar-tutorial/.
```
---

### 5. Test Your WebAR
1. Open the URL on an AR-compatible device.
2. Tap the AR button to view your model in augmented reality.

---

### 6. Customization
- **Edit Layout:** Modify style.css for a custom design.
- **Change AR Behavior:** Update the <model-viewer> tag in index.html.
