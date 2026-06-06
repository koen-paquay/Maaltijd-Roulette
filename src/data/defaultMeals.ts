/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Meal } from '../types';

export const DEFAULT_MEALS: Meal[] = [
  // Pasta (pasta)
  { id: 'p1', name: 'Spaghetti Bolognese met Rundergehakt', base: 'pasta', isVegetarian: false, notes: 'Klassieke Italiaanse favoriet met geraspte kaas' },
  { id: 'p2', name: 'Vegetarische Lasagne met Spinazie & Ricotta', base: 'pasta', isVegetarian: true, notes: 'Rijkgevulde lasagne met verse tomatensaus' },
  { id: 'p3', name: 'Penne met Romige Kip-Pesto & Broccoli', base: 'pasta', isVegetarian: false, notes: 'Met malse kippendijen en basilicumpesto' },
  { id: 'p4', name: 'Gnocchi met Tomatensaus en Mozzarella', base: 'pasta', isVegetarian: true, notes: 'Uit de oven met een krokante kaaslaag' },
  { id: 'p5', name: 'Macaroni en Kaas (Mac & Cheese) met Blomkool', base: 'pasta', isVegetarian: true, notes: 'Lekker krokant uit de oven met verborgen groenten' },

  // Aardappels (aardappels)
  { id: 'a1', name: 'Boerenkoolstamppot met Rookworst', base: 'aardappels', isVegetarian: false, notes: 'Hollandse klassieker met jus en zuur' },
  { id: 'a2', name: 'Aardappelgratin met Broccoli en Kaas', base: 'aardappels', isVegetarian: true, notes: 'Romige ovenschotel met een goudbruin korstje' },
  { id: 'a3', name: 'Gebakken Aardappeltjes met Kipschnitzel en Slasla', base: 'aardappels', isVegetarian: false, notes: 'Lekker vlot met een frisse komkommersalade' },
  { id: 'a4', name: 'Hutspot met Vegetarische Gehaktballen', base: 'aardappels', isVegetarian: true, notes: 'Stamppot van wortel en ui met een lekkere vega bal' },
  { id: 'a5', name: 'Gepofte Aardappel met Zure Room en Bieslook', base: 'aardappels', isVegetarian: true, notes: 'Gevuld met kruidenroom, gepofte mais en tomaat' },

  // Rijst (rijst)
  { id: 'r1', name: 'Kip Tikka Masala met Rijst en Naan', base: 'rijst', isVegetarian: false, notes: 'Zacht-pittige Indiase curry met malse kip' },
  { id: 'r2', name: 'Vegetarische Nasi Goreng met Satésaus', base: 'rijst', isVegetarian: true, notes: 'Gewokte rijst met prei, kool, gebakken ei en kroepoek' },
  { id: 'r3', name: 'Poké Bowl met Krokante Tofu en Edamame', base: 'rijst', isVegetarian: true, notes: 'Sushi-rijst met mango, avocado, zeewier en sushisaus' },
  { id: 'r4', name: 'Chili con Carne met Rijst en Zure Room', base: 'rijst', isVegetarian: false, notes: 'Mexicaanse stoofschotel met rode bonen en gehakt' },
  { id: 'r5', name: 'Romige Champignon Risotto met Parmezaan', base: 'rijst', isVegetarian: true, notes: 'Trage Italiaanse klassieker met rucola en truffelolie' },

  // Noedels (noedels)
  { id: 'n1', name: 'Bami Goreng met Sate en Atjar', base: 'noedels', isVegetarian: false, notes: 'Indonesische nootachtige bami met kippendij-saté' },
  { id: 'n2', name: 'Veggie Pad Thai met Tofu en Pinda', base: 'noedels', isVegetarian: true, notes: 'Thaise rijstnoedels met limoen taugé en pinda crunch' },
  { id: 'n3', name: 'Ramen Noedelsoep met Shiitakes & Gekookt Ei', base: 'noedels', isVegetarian: true, notes: 'Rijke Japanse bouillon met verse groenten en sesam' },
  { id: 'n4', name: 'Teriyaki Beef Noedels met Paksoi', base: 'noedels', isVegetarian: false, notes: 'Snelroerbak met runderreepjes en zoete teriyakisaus' },
  { id: 'n5', name: 'Sesam-Prik Noedels met Knapperige Spitskool', base: 'noedels', isVegetarian: true, notes: 'Met pinda-sesamsaus en krokante sjalotjes' },

  // Overig (overig)
  { id: 'o1', name: 'Mexicaanse Wraps met Gekruid Gehakt', base: 'overig', isVegetarian: false, notes: 'Zelf vullen met mais, bonen, salsa en geraspte kaas' },
  { id: 'o2', name: 'Zelfgemaakte Tomaten-Groentesoep met Baguette', base: 'overig', isVegetarian: true, notes: 'Rijke vegetarische soep boordevol verse kruiden en balletjes' },
  { id: 'o3', name: 'Couscoussalade met Feta, Munt en Granaatappel', base: 'overig', isVegetarian: true, notes: 'Heerlijk frisse mediterrane salade met geroosterde pompoen' },
  { id: 'o4', name: 'Shakshuka (Eieren in Pittige Tomatensaus)', base: 'overig', isVegetarian: true, notes: 'Geserveerd met warm pitabrood en hummus' },
  { id: 'o5', name: 'Turkse Pizza (Lahmacun) met Falafel & Knoflook', base: 'overig', isVegetarian: true, notes: 'Met sla, tomaat, komkommer en romige saus' },
  { id: 'o6', name: 'Hartige Quiche met Geitenkaas, Spinazie & Walnoot', base: 'overig', isVegetarian: true, notes: 'Franse klassieke taart met krokante bodem' },
  { id: 'o7', name: 'Traditionele Hollandse Pannenkoeken met Stroop', base: 'overig', isVegetarian: true, notes: 'Heerlijk met appel, poedersuiker of stroop' }
];
