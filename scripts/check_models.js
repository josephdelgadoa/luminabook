async function checkModels() {
    try {
        const response = await fetch("https://openrouter.ai/api/v1/models");
        const data = await response.json();

        const sdLike = data.data.filter(m => m.id.toLowerCase().includes("stable-diffusion")).map(m => m.id);
        const recraftLike = data.data.filter(m => m.id.toLowerCase().includes("recraft")).map(m => m.id);

        console.log("SD Models:", sdLike);
        console.log("Recraft Models:", recraftLike);
    } catch (e) {
        console.error("Error fetching models:", e);
    }
}

checkModels();
