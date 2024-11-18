import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fs from 'fs/promises';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = 8080;

// Define specific routes first
app.get('/memory/:memoryId', async (req, res) => {
    try {
        const timelineData = JSON.parse(
            await fs.readFile(path.join(__dirname, 'static', 'timeline_graph.json'), 'utf8')
        );

        const memory = timelineData.nodes.find(node => node.key === req.params.memoryId);

        if (memory) {
            const html = `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="utf-8">
                    <style>
                        body {
                            margin: 0;
                            padding: 10px;
                            font-family: 'Consolas', 'Monaco', monospace;
                            font-size: 12px;
                            line-height: 1.4;
                            background: #000;
                        }
                    </style>
                    <script>
                        function replaceWidgetTagWithIframe() {
                            var divs = document.querySelectorAll("#elevenlabs-audionative-widget");

                            divs.forEach(function (div) {
                                var width = div.getAttribute("data-width");
                                var height = div.getAttribute("data-height");
                                var frameBorder = div.getAttribute("data-frameBorder");
                                var scrolling = div.getAttribute("data-scrolling");
                                var publicUserId = div.getAttribute("data-publicUserId");
                                var small = div.hasAttribute("data-small") ? \`&small=\${div.getAttribute("data-small")}\` : "";
                                var textColor = '';// div.hasAttribute("data-textColor") ? \`&textColor=\${div.getAttribute("data-textColor")}\` : "";
                                var backgroundColor = '';//div.hasAttribute("data-backgroundColor") ? \`&backgroundColor=\${div.getAttribute("data-backgroundColor")}\` : "";
                                var projectId = div.hasAttribute("data-projectId") ? "&projectId=" + div.getAttribute("data-projectId") : "";
                                var playerUrl = div.hasAttribute("data-playerUrl") ? div.getAttribute("data-playerUrl") : "https://elevenlabs.io/player";
                                var qa = div.hasAttribute("data-qa") ? \`&qa=\${div.getAttribute("data-qa")}\` : "";
                                var src = playerUrl + \`?publicUserId=\${publicUserId}\` + \`\${projectId}\${textColor}\${backgroundColor}\${small}\${qa}\`;

                                var iframeTag = document.createElement("iframe");
                                iframeTag.id = "AudioNativeElevenLabsPlayer";
                                iframeTag.width = width;
                                iframeTag.height = height;
                                iframeTag.style.maxHeight = height + "px";
                                iframeTag.frameBorder = frameBorder;
                                iframeTag.scrolling = scrolling;
                                iframeTag.src = src;

                                div.parentNode.replaceChild(iframeTag, div);
                            });
                        }

                        window.addEventListener("load", function () {
                            console.log("Window load event triggered");
                            replaceWidgetTagWithIframe();
                        });

                        window.addEventListener("message", function (event) {
                            console.log("Received message event:", event.data);

                            if (event.data === "audioNativeUrlRequest") {
                                console.log("Handling audioNativeUrlRequest");
                                const frame = document.getElementById("AudioNativeElevenLabsPlayer");
                                const faviconElements = document.querySelectorAll('link[rel="icon"]');
                                if (frame && frame.contentWindow) {
                                    const message = {
                                        id: "audioNativeUrlResponse",
                                        url: window.location.href,
                                        favicons: Array.from(faviconElements).map(element => ({
                                            href: element.href,
                                            sizes: Array.from(element.sizes).join(" "),
                                        })),
                                    };
                                    console.log("Sending response:", message);
                                    frame.contentWindow.postMessage(message, "*");
                                }
                            }

                            if (event.data === "audioNativeHideRequest") {
                                console.log("Handling audioNativeHideRequest");
                                const frame = document.getElementById("AudioNativeElevenLabsPlayer");
                                frame.height = 0;
                            }
                        });

                        window.addEventListener("beforeunload", function () {
                            console.log("Window beforeunload event triggered");
                            const frame = document.getElementById("AudioNativeElevenLabsPlayer");
                            if (frame) {
                                frame.remove();
                            }
                        });

                        // Initial call
                        replaceWidgetTagWithIframe();
                    </script>
                </head>
                <body>
                    <div id="elevenlabs-audionative-widget" 
                        data-height="90" 
                        data-width="100%" 
                        data-frameborder="no" 
                        data-scrolling="no"
                        data-autoplay="true"
                        data-publicuserid="35d355a390902c451dabd06fdfe93f98157eb908052465f5fa2d42adb52472c3" 
                        data-playerurl="https://elevenlabs.io/player/index.html"
                        data-textcolor="rgba(255, 255, 255, 0.9)"
                        data-backgroundcolor="rgba(0, 0, 0, 0.5)">
                        Loading the <a href="https://elevenlabs.io/text-to-speech" target="_blank" rel="noopener">Elevenlabs Text to Speech</a> AudioNative Player...
                    </div>
                    <div>
                        <h3 class="memory-title" style="display: none;">${memory.attributes.name}</h3>
                        <div class="memory-date" style="display: none;">
                            ${new Date(memory.attributes.timestamp).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                            })}
                        </div>
                        <div class="memory-description">${memory.attributes.description}</div>
                        <div class="memory-meta" style="display: none;">
                            Timeline: ${memory.attributes.timeline || 'main'}
                            ${memory.attributes.type ? ` • Type: ${memory.attributes.type}` : ''}
                        </div>
                    </div>
                </body>
                </html>
            `;
            res.send(html);
        } else {
            res.status(404).send('<html><body>Memory not found</body></html>');
        }
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('<html><body>Internal server error</body></html>');
    }
});

// Then serve static files
app.use(express.static('static'));

// Root endpoint can come after static files
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'static', 'index.html'));
});

// Start server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
}); 