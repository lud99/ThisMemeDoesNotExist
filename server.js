const express = require('express');
const app = express();
const cookieParser = require('cookie-parser');
const server = require('http').createServer(app);
const fs = require("fs");
const Words = require('./server/words.js');
const words = new Words().words;
const seedrandom = require('seedrandom');
const { createCanvas, loadImage } = require('canvas')

server.listen(process.env.PORT || 3000);
process.stdout.write('\033c') //Clear console
console.log("Server started");

const imgPath = './server/images/'
const images = [imgPath + '1.jpg', imgPath + '2.jpg', imgPath + '3.jpg', imgPath + '4.jpg', imgPath + '5.jpg', 
	imgPath + '6.jpg', imgPath + '7.jpg', imgPath + '8.jpg', imgPath + '9.jpg', imgPath + '10.jpg'];


function createId(len = 6, chars = 'abcdefghijklmnopqrstuvwxyz0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ') {
	let id = "";
	while (len--) {
		id += chars[Math.random() * chars.length | 0];
	}
	return id;
}

function generateMeme(res, id, wordCount = 8) {
	const canvas = createCanvas(752, 501);
	const context = canvas.getContext('2d');

	const rng = seedrandom(id);

	//Canvas text setup
	context.lineJoin = "round";
	context.lineWidth = 7;

	context.fillStyle = "#ffffff";
	context.strokeStyle = '#000000'

	context.font = "50px Impact";
	context.textAlign = "center"; 	

	console.log("Generating meme with seed '%s'", id);

	//Generate words and choose image
	const image = images[rng() * images.length | 0];
	const bottomText = generateWords();
	const topText = generateWords();

	//Draw
	draw(image, bottomText, topText)

	function generateWords() {
		let text = [];

		let i = 0; 
		while (i < wordCount) {
			text.push(words[rng() * words.length | 0]);
			i++;
		} 

		return text.join(' ');
	}

	function draw(image_, bottomText, topText) {
		image_.width = 752;
		image_.height = 501;

		//Load the image
		loadImage(image_).then((image) => {
			context.drawImage(image, 0, 0, 752, 501); //Draw image

			//Draw text
			wrapText(topText, canvas.width/2, 50, canvas.width-50, 60);
			wrapText(bottomText, canvas.width/2, canvas.height-80, canvas.width-50, 60);

			//Convert meme to png and save it
			const buf = canvas.toBuffer();
			fs.writeFile("server/memes/" + id + ".png", buf, (err) => {
				if (err) throw err;

				//Send generated meme to client
			 	console.log("Sending a meme to a client");
			 	//res.cookie("id", id);
				res.sendFile(__dirname + "/server/memes/" + id + ".png");
			});
		});
	}

	function wrapText (text, x, y, maxWidth, lineHeight) {
	    var words = text.split(' '), line = '', lineCount = 0, i, test, metrics;

	    for (i = 0; i < words.length; i++) {
	        test = words[i];
	        metrics = context.measureText(test);
	        while (metrics.width > maxWidth) {
	            // Determine how much of the word will fit
	            test = test.substring(0, test.length - 1);
	            metrics = context.measureText(test);
	        }
	        if (words[i] != test) {
	            words.splice(i + 1, 0,  words[i].substr(test.length))
	            words[i] = test;
	        }  

	        test = line + words[i] + ' ';  
	        metrics = context.measureText(test);
	        
	        if (metrics.width > maxWidth && i > 0) {
	            drawText(line, x, y);
	            line = words[i] + ' ';
	            y += lineHeight;
	            lineCount++;
	        }
	        else {
	            line = test;
	        }
	    }

	    drawText(line, x, y);
	}

	function drawText(line, x, y) {
		context.strokeText(line, x, y);
		context.fillText(line, x, y);
	}
}


app.get("/", function(req, res) {
	let id = req.query.id;
	if (!id) id = createId();

	res.send("hi");

	generateMeme(res, id);
});

/*app.get("/id", function(req, res) {
	res.sendFile(__dirname + "/index.html");
});*/

