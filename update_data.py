import os
import json
import re

# We are now in /Users/hbakesson/Coding/soder/
# Data is in /Users/hbakesson/Coding/soder/sodermalm.one/
base_dir = "/Users/hbakesson/Coding/soder"
data_subdir = "sodermalm.one"
root_dir = os.path.join(base_dir, data_subdir)
entries = []

exclude_dirs = ["_downloads.html", "index.html", "index_old.html", "innehall", "historia", "nyarsbild.jpg", "textzzz.jpg", ".DS_Store", ".git"]

def format_name(name):
    special = {
        "asoberget": "Åsöberget",
        "annalindhagen": "Anna Lindhagens Täppa",
        "ansgarieg": "Ansgariegatan",
        "barnangen": "Barnängen",
        "bastugatan": "Bastugatan",
        "bellmansgatannorr": "Bellmansgatan (Norr)",
        "bellmansgatanshornsg": "Bellmansgatan (Söder om Hornsgatan)",
        "bengtekenhjelmsgatan": "Bengt Ekenhjelmsgatan",
        "bergsprangargrand": "Bergsprängargränd",
        "bjorngardsgatan": "Björngårdsgatan",
        "blecktornsgrand": "Blecktornsgränd",
        "bondegatan": "Bondegatan",
        "brannkyrkagost": "Brännkyrkagatan (Öst)",
        "brannkyrkagvast": "Brännkyrkagatan (Väst)",
        "danviken": "Danviken",
        "ekermanskamalmg": "Ekermanska Malmgården",
        "ersta": "Ersta",
        "fafangan": "Fåfängan",
        "fargargavljus": "Färgargårdstorget",
        "fatburen": "Fatburen",
        "fiskarroddargatan": "Fiskargatan / Roddargatan",
        "fjallgatan": "Fjällgatan",
        "fjallgatannorr": "Fjällgatan (Norr)",
        "fjallgatansoder": "Fjällgatan (Söder)",
        "folkungagatan": "Folkungagatan",
        "fredmansgatan": "Fredmansgatan",
        "glasbruksgatan": "Glasbruksgatan",
        "gotgatan": "Götgatan",
        "heleneborg": "Heleneborg",
        "hogalid": "Högalid",
        "hogbergsgost": "Högbergsgatan (Öst)",
        "hogbergsgvast": "Högbergsgatan (Väst)",
        "hornsgatan": "Hornsgatan",
        "hornsgatanostsoder": "Hornsgatan (Öst/Söder)",
        "katarina": "Katarina",
        "kocksgatan": "Kocksgatan",
        "krukmakargatan": "Krukmakargatan",
        "kvarngatan": "Kvarngatan",
        "langholmen": "Långholmen",
        "mariaberget": "Mariaberget",
        "nytorget": "Nytorget",
        "nytorgsgatan": "Nytorgsgatan",
        "ostgotagatan": "Östgötagatan",
        "reimersholme": "Reimersholme",
        "renstjernasgatan": "Renstiernas Gata",
        "skanegatanostnytgt": "Skånegatan",
        "slussen": "Slussen",
        "sodermannagatan": "Södermannagatan",
        "stpaulsgatan": "Sankt Paulsgatan",
        "skaraborgsgatan": "Skaraborgsgatan",
        "skinnarviksberget": "Skinnarviksberget",
        "stadsgarden": "Stadsgården",
        "stigberget": "Stigberget",
        "stigbergsgatan": "Stigbergsgatan",
        "swedenborgsgatan": "Swedenborgsgatan",
        "tavastgatan": "Tavastgatan",
        "timmermansgatan": "Timmermansgatan",
        "tjarhovsgatan": "Tjärhovsgatan",
        "tjarhovsgmellgotgrenstj": "Tjärhovsgatan",
        "torkelknutssonsgatan": "Torkel Knutssonsgatan",
        "vastgotagatan": "Västgötagatan",
        "vitabergen": "Vita Bergen",
        "wollmaryxkullsgatan": "Wollmar Yxkullsgatan",
        "gatorbyggnplats": "Gator och Byggnadsplatser",
        "ettbergvidvattnet": "Ett berg vid vattnet",
    }
    
    if name in special:
        return special[name]
        
    # Heuristic for other names
    res = name
    # Ensure Swedish characters are handled if possible, though IDs are usually ASCII
    # Basic capitalization
    return res.capitalize()

if not os.path.exists(root_dir):
    print(f"Error: Directory {root_dir} not found.")
    exit(1)

for item in sorted(os.listdir(root_dir)):
    item_path = os.path.join(root_dir, item)
    if os.path.isdir(item_path) and item not in exclude_dirs:
        images = [f for f in os.listdir(item_path) if f.lower().endswith(('.jpg', '.jpeg', '.png'))]
        full_images = [img for img in images if "min" not in img.lower() and "thumb" not in img.lower()]
        
        main_image = None
        if full_images:
            full_images.sort(key=lambda x: os.path.getsize(os.path.join(item_path, x)), reverse=True)
            main_image = f"{data_subdir}/{item}/{full_images[0]}"
        elif images:
            main_image = f"{data_subdir}/{item}/{images[0]}"
            
        html_files = [f for f in os.listdir(item_path) if f.lower().endswith(('.html', '.htm'))]
        main_html = None
        
        # Priority for main page selection
        candidates = [f"{item}.html", f"{item}.htm", "index.html", "index.htm"]
        main_file_name = None
        for cand in candidates:
            if cand in html_files:
                main_file_name = cand
                main_html = f"{data_subdir}/{item}/{cand}"
                break
        
        if not main_html and html_files:
            html_files.sort(key=len)
            main_file_name = html_files[0]
            main_html = f"{data_subdir}/{item}/{main_file_name}"
            
        if main_html and main_file_name:
            # Read the HTML content (now all modernized UTF-8)
            html_content = ""
            try:
                full_html_path = os.path.join(item_path, main_file_name)
                with open(full_html_path, "r", encoding="utf-8") as hf:
                    html_content = hf.read()
            except Exception as e:
                print(f"Error reading {main_html}: {e}")

            # Add the main entry
            entries.append({
                "id": item,
                "name": format_name(item),
                "path": main_html,
                "image": main_image,
                "content": html_content
            })
            
            # Special case for "Ett berg vid vattnet" in stigberget directory
            if item == "stigberget" and os.path.exists(os.path.join(item_path, "bergvidvattnet.html")):
                try:
                    with open(os.path.join(item_path, "bergvidvattnet.html"), "r", encoding="utf-8") as hf:
                        bv_content = hf.read()
                            
                    entries.append({
                        "id": "ettbergvidvattnet",
                        "name": "Ett berg vid vattnet",
                        "path": f"{data_subdir}/{item}/bergvidvattnet.html",
                        "image": f"{data_subdir}/{item}/soderfrskeppsbr1a.jpg",
                        "content": bv_content
                    })
                except Exception as e:
                    print(f"Error reading bergvidvattnet.html: {e}")

# Output as JavaScript file to avoid CORS issues
js_content = f"const STREET_DATA = {json.dumps(entries, ensure_ascii=False, indent=2)};"
with open(os.path.join(base_dir, "data.js"), "w", encoding="utf-8") as f:
    f.write(js_content)

print(f"Extracted {len(entries)} entries with content to data.js.")
