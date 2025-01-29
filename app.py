from flask import Flask, jsonify, request
from diffusers import StableDiffusionPipeline
import torch

app = Flask(__name__)

# Initialize Flux pipeline
model_id = "CompVis/stable-diffusion-v1-4"
pipe = StableDiffusionPipeline.from_pretrained(model_id)
pipe = pipe.to("cuda" if torch.cuda.is_available() else "cpu")

@app.route('/generate-image', methods=['POST'])
def generate_image():
    prompt = request.json.get('prompt', 'A beautiful sunset over mountains')
    images = pipe(prompt).images
    return jsonify({'status': 'success', 'image': str(images[0])})

if __name__ == '__main__':
    app.run(port=5000)
