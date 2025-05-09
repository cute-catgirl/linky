import { addPondiverseButton, fetchPondiverseCreation } from "/pondiverse.js";

function parseSource(source) {
  const lines = source.split("\n");
  const sections = {};
  let currentSection = "main";
  let buffer = [];

  for (let line of lines) {
    line = line.trim();
    if (line.startsWith("//") || line === "") continue;

    const match = line.match(/^(.+?):\s*(.*)$/);

    if (match) {
      if (buffer.length > 0) {
        sections[currentSection] = buffer.join("\n");
        buffer = [];
      }
      currentSection = match[1];
      if (match[2]) buffer.push(match[2]);
    } else {
      buffer.push(line);
    }
  }
  if (buffer.length > 0) {
    sections[currentSection] = buffer.join("\n");
  }
  return sections;
}

function renderSection(sections, sectionName, container) {
    const content = sections[sectionName] || '';
    const paragraphs = content.split(/\n\s*\n/);
  
    paragraphs.forEach((para, idx) => {
      const p = document.createElement('div');
      p.style.marginBottom = '1em';
  
      const unfoldContainer = document.createElement('div');
      unfoldContainer.className = 'unfold-container';
  
      const regex = /(\[([^\]]+)\]|<([^>]+)>)/g;
      let lastIndex = 0;
      let match;
  
      while ((match = regex.exec(para)) !== null) {
        if (match.index > lastIndex) {
          p.appendChild(
            document.createTextNode(para.slice(lastIndex, match.index))
          );
        }
  
        if (match[2]) {
          const linkName = match[2];
          const link = document.createElement('a');
          link.textContent = linkName;
          link.onclick = function (e) {
            e.preventDefault();
            link.onclick = null;
            link.className = 'disabled';
            if (sections[linkName]) {
              const unfolded = document.createElement('div');
              unfolded.className = 'unfolded';
              unfolded.style.marginLeft = '16px';
              renderSection(sections, linkName, unfolded);
              unfoldContainer.appendChild(unfolded);
            }
          };
          p.appendChild(link);
        } else if (match[3]) {
          const inlineName = match[3];
          const link = document.createElement('a');
          link.href = '#';
          link.textContent = inlineName;
          link.onclick = function (e) {
            e.preventDefault();
            const span = document.createElement('span');
            span.style.fontStyle = 'italic';
            span.textContent = sections[inlineName] || inlineName;
            link.replaceWith(span);
          };
          p.appendChild(link);
        }
  
        lastIndex = regex.lastIndex;
      }
      if (lastIndex < para.length) {
        p.appendChild(
          document.createTextNode(para.slice(lastIndex))
        );
      }
  
      container.appendChild(p);
      container.appendChild(unfoldContainer);
    });
}

function generateImageData() {
    const player = document.getElementById('player');
    return html2canvas(player, {
        backgroundColor: '#fff',
        scale: 2,
        width: 400,
        height: 400,
        useCORS: true,
    }).then(canvas => {
        const dataUrl = canvas.toDataURL("image/png");
        return dataUrl;
    }).catch(error => {
        console.error("Error generating image:", error);
        return "";
    });
}
  
let initialSource = `
// This is a comment. It will not show up in the final output.

This is a [link] to another paragraph. They can also be [recursive], or <inline>.

link: This is another section, and this is [another link]!

another link: Hi there!

recursive: Links can be [recursive]

inline: inline. Like this!
`;

let sections = parseSource(initialSource);

// Load from URL params if ID exists
const creationParam = new URL(window.location).searchParams.get("id");
if (creationParam) {
    const creation = await fetchPondiverseCreation(creationParam);
    if (creation) {
        sections = parseSource(creation.data);
        initialSource = creation.data;
    }
}

const reloadButton = document.getElementById('reload');
reloadButton.onclick = function () {
  const newSource = sourceContainer.value;
  const newSections = parseSource(newSource);
  player.innerHTML = '';
  renderSection(newSections, 'main', player);
};

// Source container
const sourceContainer = document.getElementById('source');
sourceContainer.value = initialSource;

// Initial render
renderSection(sections, 'main', player);

// Pondiverse
addPondiverseButton(() => {
    return generateImageData().then(imageData => {
        return {
            type: "linky",
            data: sourceContainer.value,
            image: imageData,
        };
    });
});