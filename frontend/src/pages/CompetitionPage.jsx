import { useState } from 'react';
import CompetitionInvitation from '../components/competition/CompetitionInvitation.jsx';
import CompetitorList from '../components/competition/CompetitorList.jsx';
import CompetitionRoom from '../components/competition/CompetitionRoom.jsx';

const CompetitionPage = () => {
  const [invitations, setInvitations] = useState([]);
  const [selectedInvitation, setSelectedInvitation] = useState(null);
  const [showCompetitorList, setShowCompetitorList] = useState(false);
  const [activeCompetition, setActiveCompetition] = useState(null);

  return (
    <div className="min-h-screen bg-bg-primary pt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!activeCompetition ? (
          <div className="space-y-6">
            <h1 className="text-3xl font-bold text-text-primary">Competitions</h1>
            
            {invitations.length === 0 ? (
              <div className="bg-bg-card rounded-lg p-8 text-center">
                <p className="text-text-secondary">No competition invitations available</p>
              </div>
            ) : (
              <div className="space-y-4">
                {invitations.map(invitation => (
                  <CompetitionInvitation
                    key={invitation.invitation_id}
                    invitation={invitation}
                    onViewCompetitors={() => {
                      setSelectedInvitation(invitation);
                      setShowCompetitorList(true);
                    }}
                  />
                ))}
              </div>
            )}

            {showCompetitorList && selectedInvitation && (
              <CompetitorList
                invitation={selectedInvitation}
                onSelectCompetitor={(competitor) => {
                  // TODO: Handle competitor selection
                  console.log('Selected competitor:', competitor);
                  setShowCompetitorList(false);
                }}
                onClose={() => setShowCompetitorList(false)}
              />
            )}
          </div>
        ) : (
          <CompetitionRoom
            competition={activeCompetition}
            onCompetitionComplete={() => setActiveCompetition(null)}
          />
        )}
      </div>
    </div>
  );
};

export default CompetitionPage;



