import urllib.request
import ssl
from bs4 import BeautifulSoup

ctx = ssl._create_unverified_context()
url = "https://en.wikipedia.org/wiki/2026_FIFA_World_Cup_squads"
headers = {'User-Agent': 'Mozilla/5.0'}
req = urllib.request.Request(url, headers=headers)

try:
    with urllib.request.urlopen(req, context=ctx) as response:
        html = response.read()
        soup = BeautifulSoup(html, 'lxml')
        
        czech_h3 = None
        for h3 in soup.find_all('h3'):
            if "Czech" in h3.get_text():
                czech_h3 = h3
                break
                
        if czech_h3:
            print("Found Czech Republic h3.")
            next_table = czech_h3.find_next('table')
            if next_table:
                print("Found table via find_next!")
                # Print class of table
                print(next_table.get('class'))
                # Print first row
                for tr in next_table.find_all('tr')[:2]:
                    print([td.get_text().strip() for td in tr.find_all(['td', 'th'])])
            else:
                print("No table found via find_next.")
        else:
            print("Czech Republic h3 not found.")
except Exception as e:
    print("Error:", e)
