const CompetitorList = ({ invitation, onSelectCompetitor, onClose }) => {
  if (!invitation.potential_competitors || invitation.potential_competitors.length === 0) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-bg-card rounded-lg border border-gray-200 dark:border-gray-700 shadow-card p-6 max-w-2xl w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold text-text-primary">Select Competitor</h2>
          <button
            onClick={onClose}
            className="text-text-secondary hover:text-text-primary"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        
        <p className="text-text-secondary mb-4">
          Choose a competitor from the list below. All names are anonymous for privacy.
        </p>
        
        <div className="space-y-3">
          {invitation.potential_competitors.map((competitor, index) => (
            <div
              key={index}
              className="bg-bg-secondary rounded-lg p-4 border border-gray-200 dark:border-gray-700 hover:border-primary-cyan transition-colors cursor-pointer"
              onClick={() => onSelectCompetitor(competitor)}
            >
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-semibold text-text-primary">{competitor.anonymous_id}</h3>
                  <p className="text-sm text-text-secondary">
                    Skill Level: {competitor.skill_level}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {competitor.available && (
                    <span className="px-2 py-1 rounded bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 text-xs">
                      Available
                    </span>
                  )}
                  <button className="btn-secondary">Select</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CompetitorList;




