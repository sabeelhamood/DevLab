const CompetitionInvitation = ({ invitation, onViewCompetitors }) => {
  return (
    <div className="bg-bg-card rounded-lg border border-gray-200 dark:border-gray-700 shadow-card p-6">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-semibold text-text-primary">Competition Invitation</h3>
          <p className="text-text-secondary mt-1">Course completed - Ready to compete!</p>
        </div>
        <span className="px-3 py-1 rounded-full bg-primary-cyan text-white text-sm">
          {invitation.status}
        </span>
      </div>
      
      {invitation.potential_competitors && invitation.potential_competitors.length > 0 && (
        <div className="mb-4">
          <p className="text-sm text-text-secondary mb-2">
            {invitation.potential_competitors.length} potential competitors available
          </p>
        </div>
      )}
      
      <button
        onClick={onViewCompetitors}
        className="btn-primary"
      >
        View Available Competitors
      </button>
    </div>
  );
};

export default CompetitionInvitation;




