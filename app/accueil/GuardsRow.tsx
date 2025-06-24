import React from 'react';
import { Machine, Garde } from './types';
import { formatDateKey } from './utils';

interface GuardsRowProps {
  day: Date;
  machines: Machine[];
  selectedMachines: string[];
  showLeaves: boolean;
  garde?: Garde;
  isSaturday?: boolean;
  gardes: Garde[];
}

export const GuardsRow: React.FC<GuardsRowProps> = ({
  day,
  machines,
  selectedMachines,
  showLeaves,
  garde,
  isSaturday = false,
  gardes,
}) => {
  const dayName = day.toLocaleDateString('fr-FR', { weekday: 'long' }).replace(/^\w/, (c) => c.toUpperCase());

  // Récupérer les sites uniques
  const sites = Array.from(new Set(machines.filter((m) => selectedMachines.includes(m.id)).map((m) => m.site).filter(Boolean))) as string[];

  // Trier les sites : CDS en premier, puis ST EX, puis les autres
  const sortedSites = sites.sort((a, b) => {
    if (a === b) return 0;
    if (a === 'CDS') return -1;
    if (b === 'CDS') return 1;
    if (a === 'ST EX') return -1;
    if (b === 'ST EX') return 1;
    return a.localeCompare(b);
  });

  // Ordonner les machines en fonction des sites triés
  const orderedMachines = sortedSites.flatMap((site) =>
    machines.filter((m) => m.site === site && selectedMachines.includes(m.id))
  );
  const uniqueMachinesWithoutSite = Array.from(
    new Map(machines.filter((m) => !m.site && selectedMachines.includes(m.id)).map((m) => [m.id, m]))
  ).map(([_, m]) => m);

  orderedMachines.push(...uniqueMachinesWithoutSite);

  // Calculer les indices de séparation
  const separationIndices: number[] = [];
  let currentIndex = 0;
  for (let i = 0; i < sortedSites.length; i++) {
    const machinesInSite = machines.filter((m) => m.site === sortedSites[i] && selectedMachines.includes(m.id));
    currentIndex += machinesInSite.length - 1;
    if (i < sortedSites.length - 1) separationIndices.push(currentIndex);
    currentIndex++;
  }
  if (sortedSites.length > 0 && uniqueMachinesWithoutSite.length > 0) {
    separationIndices.push(currentIndex - 1);
  }

  // Calculer la garde du dimanche si c'est samedi
  let sundayGarde: Garde | undefined = undefined;
  if (isSaturday) {
    try {
      const sunday = new Date(day);
      sunday.setDate(day.getDate() + 1);
      if (isNaN(sunday.getTime())) {
        console.error('Invalid Sunday date calculated from', day);
      } else {
        const sundayKey = formatDateKey(sunday);
        sundayGarde = gardes.find((g) => g.date === sundayKey);
      }
    } catch (error) {
      console.error('Error calculating Sunday date:', error);
    }
  }

  return (
    <>
      <tr key={`${day.toISOString()}-guard`} className="border-t border-gray-400 h-6">
        <td colSpan={2} className="p-0.5 bg-gray-100 text-center border-r-2 border-gray-600 w-60 text-xs">
          Garde {dayName}
        </td>
        <td className={`p-0.5 bg-gray-100 text-center border-r-2 border-gray-600 w-28 ${!showLeaves ? 'hidden' : ''}`}></td>
        {sortedSites.map((site, siteIndex) => {
          const machinesInSite = machines.filter((m) => m.site === site && selectedMachines.includes(m.id));
          const doctor = site === 'CDS' ? garde?.medecin_cds : site === 'ST EX' ? garde?.medecin_st_ex : null;
          return (
            <td
              key={`${site}-guard`}
              colSpan={machinesInSite.length}
              className={`p-0.5 text-center border-r ${
                separationIndices.includes(machinesInSite.length - 1 + machinesInSite.length * siteIndex)
                  ? 'border-r-2 border-gray-600'
                  : 'border-gray-400'
              }`}
              style={{
                backgroundColor: doctor?.color ?? 'rgb(229, 231, 235)',
              }}
            >
              {doctor?.initials ? <span style={{ color: 'black' }}>{doctor.initials}</span> : null}
            </td>
          );
        })}
        {uniqueMachinesWithoutSite.length > 0 && (
          <td colSpan={uniqueMachinesWithoutSite.length} className="p-0.5 text-center bg-gray-200 border-r-2 border-gray-600"></td>
        )}
      </tr>
      {isSaturday && (
        <tr key={`${day.toISOString()}-sunday-guard`} className="border-t border-gray-400 h-6">
          <td colSpan={2} className="p-0.5 bg-gray-100 text-center border-r-2 border-gray-600 w-60 text-xs">
            Garde Dimanche
          </td>
          <td className={`p-0.5 bg-gray-100 text-center border-r-2 border-gray-600 w-28 ${!showLeaves ? 'hidden' : ''}`}></td>
          {sortedSites.map((site, siteIndex) => {
            const machinesInSite = machines.filter((m) => m.site === site && selectedMachines.includes(m.id));
            const doctor = site === 'CDS' ? sundayGarde?.medecin_cds : site === 'ST EX' ? sundayGarde?.medecin_st_ex : null;
            return (
              <td
                key={`${site}-sunday-guard`}
                colSpan={machinesInSite.length}
                className={`p-0.5 text-center border-r ${
                  separationIndices.includes(machinesInSite.length - 1 + machinesInSite.length * siteIndex)
                    ? 'border-r-2 border-gray-600'
                    : 'border-gray-400'
                }`}
                style={{
                  backgroundColor: doctor?.color ?? 'rgb(229, 231, 235)',
                }}
              >
                {doctor?.initials ? <span style={{ color: 'black' }}>{doctor.initials}</span> : null}
              </td>
            );
          })}
          {uniqueMachinesWithoutSite.length > 0 && (
            <td colSpan={uniqueMachinesWithoutSite.length} className="p-0.5 text-center bg-gray-200 border-r-2 border-gray-600"></td>
          )}
        </tr>
      )}
    </>
  );
};
