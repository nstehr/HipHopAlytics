import urllib2
import json
import time

category_dict = {'East Coast':'East_Coast_hip_hop_musicians',
                 'West Coast':'West_Coast_hip_hop_musicians',
                 'Midwest':'Midwest_hip_hop_musicians',
                 'Southern':'Southern_hip_hop_musicians'}

def main():
    location_to_rapper = {}
    for category in category_dict.keys():
        location_to_rapper[category] = get_rappers(category)
    rapper_data_file = open("rappers.json", "w")
    json_data = json.dumps(location_to_rapper)
    rapper_data_file.write(json_data)
    rapper_data_file.close()

def get_rappers(category):
    wiki_link = 'http://en.wikipedia.org/w/api.php?action=query&list=categorymembers&cmtitle=Category:%s&format=json' % (category_dict[category])
    response = urllib2.urlopen(wiki_link)
    data = json.load(response)

    rappers = []
    while u'query-continue' in data:    
        rapper_pages =  data['query']['categorymembers']
        rappers.extend([rapper_page['title'].split('(')[0].strip() for rapper_page in rapper_pages])
        next_page = data['query-continue']['categorymembers']['cmcontinue']
        next_link = wiki_link+"&cmcontinue=%s"%next_page
        response = urllib2.urlopen(next_link)
        data = json.load(response)
        time.sleep(1)

    return rappers


if __name__ == '__main__':
    main()
