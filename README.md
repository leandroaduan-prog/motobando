# MotoBando

App web (instalável no celular) para viagem de moto em grupo ou solo.

- Grupo ao vivo com código (guia, integrante, garupa), GPS real de cada um no mapa
- Rota real (OSRM) com paradas, postos reais na rota (OpenStreetMap/Overpass) e previsão de chuva (Open-Meteo)
- Barra linear com os capacetes até a próxima parada, alerta de tela cheia quando alguém fica para trás
- Cálculo de combustível por moto; paradas do grupo pela moto que roda menos
- Divisão de gastos (garupa incluso), checklist, envio por WhatsApp, modo estrada para usar de luva
- SOS para o grupo e para quem usa o app num raio de até 50 km

## Rodar

```
npm install
npm start      # http://localhost:3000
```

Variáveis: `PORT` (padrão 3000), `DATA_DIR` (onde salva as viagens, padrão `./data`).

## Limites desta versão web

- O GPS só atualiza com o app aberto na tela (navegadores não rodam GPS em segundo plano). A versão de loja resolve.
- Mapa offline: guarda os pedaços de mapa já vistos. Download de região inteira fica para a versão de loja.
- Serviços públicos gratuitos (OSRM, Nominatim, Overpass, tiles do OpenStreetMap) têm limite de uso; para muitos usuários, trocar por um provedor pago.
