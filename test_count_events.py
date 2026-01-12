import json
h = json.load(open('financeiro_history.json'))
print(f'Total de eventos: {len(h["eventos"])}')
