from flask import Flask, jsonify, request

from face_sim import predict
from werkzeug.utils import secure_filename	
import os

app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = './data'


@app.route("/helloworld/")
def helloworld():
    return "hello world"


@app.route('/id_snap', methods=['GET', 'POST'])
def upload_id_picture():
    if request.method == 'POST':
        if 'id_pic' not in request.files:
            return 'File is missing', 404

        id_pic = request.files['id_pic']

        if id_pic.filename == '':
            return 'File is missing', 404

        filename = secure_filename(id_pic.filename)
        id_pic.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))	
        result = predict.main()
        return jsonify(result), 200

