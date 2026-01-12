import json

h = json.load(open('financeiro_history.json'))
print(f'Total de eventos: {len(h["eventos"])}')
for i, e in enumerate(h['eventos']):
    print(f'{i+1}. {e["tipo"]} - R$ {e.get("valor", 0)} - ts {e["timestamp"]}')
