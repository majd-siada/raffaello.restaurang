/**
 * Meny innehåll från Raffaello Canva-meny (Stekhus & Bar).
 * Uppdatera här när menyn ändras i lokalen.
 */

export const MENU_PAGES = [
  {
    id: 'forratter-varmratter',
    label: 'Förrätter & Varmrätter',
    layout: 'two-col',
    columns: [
      {
        title: 'Förrätter',
        items: [
          { name: 'Vitlöksbröd', price: 99, description: 'Mozzarellaost, aioli och körsbärstomater.' },
          { name: 'Nduja', price: 99, description: 'Surdegsbröd, italiensk salami och honung.' },
          { name: 'Chèvre', price: 109, description: 'Grillad chèvreost, honung och valnötter.' },
          { name: 'Hot Chili Gamberi', price: 109, description: 'Surdegsbröd, färsk basilika och aiolisås.' },
          { name: 'Burrata', price: 109, description: 'Pinjenötter, ruccola, körsbärstomater och färsk basilika.' },
          {
            name: 'Ceviche på räkor',
            price: 119,
            description:
              'Med avokado, lime, tropiska toner av mango & ananas. Toppad med krispiga risnudlar och en liten kick av chili.',
          },
        ],
      },
      {
        title: 'Varmrätter',
        notes: [
          { text: 'Allt kött är 300g', tone: 'gold' },
          { text: 'Pommes kan bytas ut mot broccolipuré! Fråga personal.', tone: 'muted' },
        ],
        items: [
          {
            name: 'Kycklingspett',
            price: 194,
            description: 'Svensk kyckling, grillade grönsaker, klyftpotatis och svampsås.',
          },
          {
            name: 'Gräddig souvas',
            price: 214,
            description: 'Picklad rödlök, rårörda lingon, sötpommes, västerbottensost, kantareller.',
          },
          {
            name: 'Grillad Fläskfilé',
            price: 229,
            description: 'Grillade grönsaker, klyftpotatis och pepparsås. Serveras med vitlökssmör.',
          },
          {
            name: 'Lammracks',
            price: 299,
            description:
              'Svenskt kött. Serveras med kappa, med klyftpotatis, ugnsrostade körsbärstomater, grillade grönsaker och rödvinssås.',
          },
          {
            name: 'Pepparstek (Grillad)',
            price: 324,
            description: 'Ryggbiff, grillade grönsaker, pommes och pepparsås. Serveras med vitlökssmör.',
          },
          {
            name: 'Grillade Entrecôte',
            price: 349,
            description: 'Grillade grönsaker, pommes, bearnaisesås. Serveras med vitlökssmör.',
          },
          {
            name: 'Raffaello Special',
            price: 369,
            description: 'Grillade oxfilé och grönsaker, sötpotatis och bearnaisesås. Serveras med vitlökssmör.',
          },
          {
            name: 'Renytterfilé',
            price: 349,
            description: 'Serveras med klyftpotatis, sparris, bacon, grillade körsbärstomater och rödvinssås.',
          },
        ],
      },
    ],
  },
  {
    id: 'fisk-pasta-burgare',
    label: 'Fisk, Pasta & Burgare',
    layout: 'two-col',
    columns: [
      {
        sections: [
          {
            title: 'Fisk',
            items: [
              {
                name: 'Fish & Chips',
                price: 169,
                description: 'Krispig torsk, gröna ärtor, citron, pommes och remouladsås.',
              },
              {
                name: 'Fjällrödingfilé',
                price: 289,
                description: 'Serveras med ugnsrostad potatis, grillade grönsaker och Raffaellosås.',
              },
            ],
          },
          {
            title: 'Pasta',
            notes: [{ text: 'Innehåller gräddsås, ruccola och parmesanost.', tone: 'gold' }],
            items: [
              { name: 'Kycklingpasta', price: 149, description: 'Currysås och kyckling.' },
              {
                name: 'Arabiathapasta',
                price: 149,
                description: 'Salami, krämig chilisås, penne, ruccola och vitlök, nyriven parmesanost.',
              },
              { name: 'Carbonara', price: 165, description: 'Bacon, lök, ägg.' },
              {
                name: 'Raffaello Pasta',
                price: 175,
                description: 'Limesås, varmrökt lax, handskalade räkor, vitlök, citron och dill.',
              },
              {
                name: 'Oxfilépasta',
                price: 175,
                description: 'Oxfilébitar, champinjoner och gorgonzola.',
              },
            ],
          },
        ],
      },
      {
        sections: [
          {
            title: 'Hamburgare',
            items: [
              {
                name: 'Cheeseburgare (Högrev 200g)',
                price: 149,
                description: 'Hamburgardressing, sallad, cheddarost och pommes.',
              },
              {
                name: 'Baconburgare (Högrev 200g)',
                price: 165,
                description:
                  'Dijonmajonnäs, krispigt bacon, sallad, picklad rödlök, tomat, cheddarost och pommes.',
              },
              {
                name: 'Raffaelloburgare Wagyu Beef 150g',
                price: 169,
                description: 'Tryffelmayo, cheddarost, bifftomat, krispig sallad och sötpotatis.',
              },
              {
                name: 'Älgburgare',
                price: 199,
                description:
                  '200 g saftig burgare på svenskt älgkött, serverad i rostat briochebröd med lagrad cheddarost, tryffelmajonnäs, picklad rödlök, krispig sallad, tomat och rårörda lingon. Serveras med pommes frites.',
              },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'pizza',
    label: 'Pizza',
    layout: 'two-col',
    columns: [
      {
        title: 'Pizza Classic',
        notes: [{ text: 'Alla innehåller tomatsås och mozzarellaost', tone: 'gold' }],
        items: [
          { name: 'Pizza Margherita', price: 125, description: 'Ost' },
          { name: 'Vesuvio', price: 125, description: 'Skinka.' },
          { name: 'Hawaii', price: 125, description: 'Skinka och ananas.' },
          { name: 'Capricciosa', price: 125, description: 'Skinka och champinjoner.' },
          {
            name: 'Kycklingpizza',
            price: 139,
            description: 'Kyckling, tomat, curry och orientdressing.',
          },
          {
            name: 'Kebabpizza',
            price: 139,
            description: 'Kebabkött, tomat, lök och orientdressing.',
          },
          {
            name: 'Turkisk Kebabpizza',
            price: 145,
            description: 'Kebabkött, lök, tomat, gurka, pepperoni, kebabsås och sallad.',
          },
        ],
      },
      {
        title: 'Deluxe Pizza',
        notes: [
          {
            text: 'Innehåller mozzarella, ruccola, körsbärstomater, färsk basilika och parmesanost',
            tone: 'gold',
          },
        ],
        items: [
          { name: 'Ndjuja', price: 149, description: 'Italisk salami' },
          { name: 'Arabiata pizza', price: 149, description: 'Salami, vitlök, stark.' },
          { name: 'Parma Pizza', price: 149, description: 'Parmaskinka och pinjenötter.' },
          {
            name: 'Pizza Raffaello',
            price: 165,
            description: 'Stekt oxfilé, champinjoner, gorgonzola och bearnaisesås.',
          },
          {
            name: 'Carpaccio Pizza',
            price: 169,
            description: 'Oxcarpaccio, parmesan, citronskiva, ruccola och Bearnaisesås.',
          },
          {
            name: 'Chili Gamberi Pizza',
            price: 169,
            description: 'Vitlöksmarinerade gambasräkor, chili, jalapeño och citron.',
          },
        ],
      },
    ],
  },
  {
    id: 'veg-barn-sallad',
    label: 'Vegetariskt & Mer',
    layout: 'two-col',
    columns: [
      {
        sections: [
          {
            title: 'Vegetariskt',
            items: [
              {
                name: 'Halloumiburgare',
                price: 149,
                description: 'Tryffelmajo, stekt halloumi, sallad, tomat, lök och pommes.',
              },
              {
                name: 'Kantarellpasta',
                price: 149,
                description: 'Stekta kantareller, vitlök, champinjoner och tryffelolja.',
              },
              {
                name: 'Chèvre-pizza',
                price: 155,
                description: 'Chèvreost, päron, valnötter och honung.',
              },
            ],
          },
          {
            title: 'Barnmeny',
            notes: [{ text: 'Festis ingår till alla måltider', tone: 'gold' }],
            items: [
              { name: 'Pannkakor', price: 99, description: 'Serveras med sylt och grädde' },
              { name: 'Nuggets', price: 99, description: 'Pommes, 6 st nuggets med valfri dressing.' },
              {
                name: 'Cheeseburgare (Kött 90g)',
                price: 99,
                description: 'Hamburgardressing, tomat, sallad och cheddarost.',
              },
              {
                name: 'Kids Entrecôte',
                price: 149,
                description: 'Liten entrecôte med pommes och bearnaisesås.',
              },
            ],
          },
        ],
      },
      {
        sections: [
          {
            title: 'Sallad',
            items: [
              {
                name: 'Burratasallad',
                price: 149,
                description: 'Burrata, tomater, ruccola, basilikaolja, parmesanost och balsamico.',
              },
              {
                name: 'Caesarsallad',
                price: 159,
                description:
                  'Välj mellan kyckling och halloumi. Krispigt bacon, krutonger, körsbärstomater, romansallad och parmesanost.',
              },
              {
                name: 'Räksallad',
                price: 175,
                description:
                  'Handskalade räkor, kokt ägg, körsbärstomater, citron, västerbottensost och aioli.',
              },
            ],
          },
          {
            title: 'Efterrätter',
            items: [
              {
                name: 'Glasskula',
                price: 45,
                description: 'Fråga personalen om kvällens smaker.',
              },
              { name: 'Kladdkaka', price: 69, description: 'Med vispgrädde.' },
              { name: 'Citron-cheesecake', price: 69 },
              { name: 'Crème Brûlée', price: 109 },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'tillbehor',
    label: 'Tillbehör & Såser',
    layout: 'two-col',
    columns: [
      {
        sections: [
          {
            title: 'Tillbehör',
            items: [
              { name: 'Pommes frites', price: 25 },
              { name: 'Pizzasallad', price: 29 },
              { name: 'Klyftpotatis', price: 30 },
              { name: 'Sötpotatis frites', price: 35 },
              { name: '6 st Lökringar', price: 40 },
              { name: '6 st Mozzarella', price: 50 },
              { name: '6 st Nuggets', price: 50 },
              { name: '6 st Chili cheese', price: 50 },
            ],
          },
          {
            title: 'Snacks',
            items: [
              { name: 'Chips', price: 29 },
              { name: 'Blandade nötter', price: 35 },
              { name: 'Tryffelchips', price: 45 },
            ],
          },
        ],
      },
      {
        title: 'Dressing',
        items: [
          { name: 'Bearnaisesås', price: 20 },
          { name: 'Orientdressing', price: 20 },
          { name: 'Hamburgerdressing', price: 20 },
          { name: 'Starksås', price: 20 },
          { name: 'Smältost', price: 25 },
          { name: 'Tryffelmajo', price: 25 },
          { name: 'Aioli', price: 25 },
          { name: 'Pepparsås', price: 29 },
        ],
      },
    ],
  },
  {
    id: 'dryck',
    label: 'Dryck',
    layout: 'two-col',
    columns: [
      {
        sections: [
          {
            title: 'Alkoholfri',
            items: [
              {
                name: 'Raffaello special',
                price: 79,
                description: 'Sprite, citron, passionfrukt och ananasjuice.',
              },
              {
                name: 'Virgin Sprite Mojito',
                price: 79,
                description: 'Lime, mynta och soda.',
              },
              { name: 'Mariastad .33cl', price: 49 },
              { name: 'Priska Päron .33cl', price: 49 },
              { name: 'Röd/Vit-vin alkoholfri', price: 65 },
            ],
          },
          {
            title: 'Öl',
            sectionPrice: 85,
            items: [
              { name: 'Norrlandsguld (50cl)' },
              { name: 'Mariastad (50cl)' },
              { name: 'Höga Kusten (50cl)' },
              { name: 'Eriksberg (50cl)' },
              { name: 'IPA' },
            ],
          },
          {
            title: 'Ölfat',
            sectionPrice: 79,
            items: [
              { name: 'Höga Kusten (40cl)' },
              { name: 'Sofiero öl (40cl)' },
              { name: 'Raffaello öl (40cl)', description: 'Merke' },
            ],
          },
        ],
      },
      {
        sections: [
          {
            title: 'Läsk',
            sectionPrice: 30,
            items: [
              {
                name: 'Coca Cola, Coca Cola Zero, Fanta, Sprite, Pepsi Max, Trocadero, Trocadero Zero, Loka',
              },
            ],
          },
          {
            title: 'Kaffe & Te',
            items: [
              { name: 'Kaffe & Te', price: 30 },
              { name: 'Espresso', price: 40 },
              { name: 'Cappuccino', price: 59 },
              { name: 'Ice Americano', price: 69 },
              { name: 'Ice Latte', price: 69 },
            ],
          },
          {
            title: 'Cider',
            sectionPrice: 79,
            items: [{ name: 'Briska Päron' }, { name: 'Briska Hallon' }],
          },
        ],
      },
    ],
  },
  {
    id: 'cocktails',
    label: 'Cocktails',
    layout: 'two-col',
    columns: [
      {
        title: 'Cocktails',
        notes: [
          { text: '(4cl) 110 SEK', tone: 'gold' },
          { text: '(6cl) 135 SEK', tone: 'gold' },
        ],
        items: [
          { name: 'Espresso Martini', description: 'Vodka, Kahlúa, espresso och kaffebönor' },
          { name: 'Whiskey Sour', description: 'Bourbon whiskey, citron och sockerlag' },
          { name: 'Old Fashioned', description: 'Bourbon, bitters och apelsinzest' },
          { name: 'Mojito', description: 'Rom, mynta, lime och soda' },
          { name: 'Aperol Spritz', description: 'Aperol, prosecco och soda' },
          { name: 'Negroni', description: 'Gin, Campari och vermouth' },
          { name: 'Pornstar Martini', description: 'Vaniljvodka, passionsfrukt och prosecco' },
          { name: 'Strawberry Daiquiri', description: 'Rom, jordgubbar och lime' },
        ],
      },
      {
        title: 'Signature cocktails',
        notes: [
          { text: '(4cl) 110 SEK', tone: 'gold' },
          { text: '(6cl) 135 SEK', tone: 'gold' },
        ],
        items: [
          { name: 'Raffaello Gold', description: 'Passionsfrukt, vodka, lime och gold dust' },
          { name: 'Arctic Berry', description: 'Gin, nordiska bär och tonic' },
          { name: 'Smokey Boulevard', description: 'Whiskey, bitters och rökt apelsin' },
        ],
      },
    ],
  },
  {
    id: 'roda-viner',
    label: 'Röda viner',
    layout: 'wine',
    intro: 'Rekommenderade Vin- & Matkombinationer',
    wines: [
      {
        name: 'Husets röd',
        details: ['Umani Ronchi (Från Italien)', 'Farmers Market (Från Italien)'],
        glass: 99,
        bottle: 275,
      },
      {
        name: 'Amarone & Ripasso',
        glass: 139,
        bottle: 399,
        pairsWith:
          'Steakhouse Signatures: Raffaello Special (oxfilé med tryffelsås), Entrecôte 300g (med bearnaise) och Pepper Steak.',
      },
      {
        name: 'Cabernet Sauvignon',
        glass: 119,
        bottle: 339,
        pairsWith: 'Burgare & Signatures: Rydberg på Raffaello, Truffle Burger och Bacon Deluxe Burger.',
        why: 'Vinets kraftiga struktur och strävhet balanserar fettet och de grillade tonerna i burgarna och nötköttet utmärkt.',
      },
      {
        name: 'Pinot Noir',
        glass: 109,
        bottle: 299,
        pairsWith:
          'Kyckling & Pasta: Crispy Chicken Burger, Oxfilépasta samt lättare kötträtter. Pizza: Carpaccio Pizza.',
        why: 'Ett elegant och bärigt rött vin som inte dominerar över ljusare kött, svamp eller krämiga pastarätter.',
      },
    ],
  },
  {
    id: 'vita-viner',
    label: 'Vita & Rosé',
    layout: 'wine',
    intro: 'Rekommenderade Vin- & Matkombinationer',
    wineGroups: [
      {
        title: 'VITA VINER',
        wines: [
          {
            name: 'Husets vit',
            details: ['Umani Ronchi (Från Italien)'],
            glass: 99,
            bottle: 275,
          },
          {
            name: 'Chardonnay',
            glass: 119,
            bottle: 339,
            pairsWith: 'Fisk & Skaldjur: Halstrad Röding och Fish & Chips Deluxe.',
            why: 'Chardonnays fylliga karaktär harmonierar med stekt/grillad fisk och rika tillbehör som remoulad eller brynt smör.',
          },
          {
            name: 'Sauvignon Blanc & Riesling',
            glass: 109,
            bottle: 299,
            pairsWith: 'Förrätter: Räktartar och Ceviche på räkor.',
            why: 'Frisk syra och citruslyft lyfter skaldjuren. Riesling klarar även chilihetta väl.',
          },
          {
            name: 'Pinot Grigio',
            glass: 109,
            bottle: 299,
            pairsWith: 'Pasta & Pizza: Carbonara, Burrata Pizza och Vegetarisk Pizza.',
            why: 'Ett friskt, lätt vin som balanserar salt chark och skär igenom krämiga ostar.',
          },
        ],
      },
      {
        title: 'ROSÉVINER',
        wines: [
          {
            name: 'Whispering Angel & Husets Rosé',
            glass: 99,
            bottle: 275,
            pairsWith: 'Pizza & Förrätter: Burrata Pizza, Parma Pizza, Räktartar samt lättare plockmat.',
            why: 'En torr, frisk och elegant rosé som är mångsidig och lyfter krämiga ostar och lufttorkad skinka.',
          },
        ],
      },
      {
        title: 'MOUSSERANDE',
        wines: [
          {
            name: 'Champagne & Prosecco',
            glass: 99,
            bottle: 275,
            pairsWith: 'Aperitif & Förrätter: Perfekt som välkomstdrink eller till räktartar och ceviche.',
            why: 'Bubblorna rensar gommen och ger en festlig, lyxig känsla till förrätter.',
          },
        ],
      },
    ],
  },
]
