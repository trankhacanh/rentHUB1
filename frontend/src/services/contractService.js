import axiosClient from './axiosClient';

const contractService = {
  getContract(contractId) {
    return axiosClient.get(`/contracts/${contractId}`);
  },

  getVersion(contractId, versionNumber) {
    return axiosClient.get(
      `/contracts/${contractId}/versions/${versionNumber}`
    );
  },

  getRevisionRequests(contractId) {
    return axiosClient.get(
      `/contracts/${contractId}/revision-requests`
    );
  },

  acceptReview(contractId) {
    return axiosClient.put(
      `/contracts/${contractId}/accept-review`
    );
  },

  requestChanges(contractId, reason) {
    return axiosClient.post(
      `/contracts/${contractId}/request-changes`,
      { reason }
    );
  },

  reviseContract(contractId, terms) {
    return axiosClient.put(
      `/contracts/${contractId}/revise`,
      { terms }
    );
  },

  sendForReview(contractId) {
    return axiosClient.post(
      `/contracts/${contractId}/send-for-review`
    );
  },

  signAsRenter(contractId) {
  return axiosClient.put(
    `/contracts/${contractId}/sign/renter`
  );
},

signAsOwner(contractId) {
  return axiosClient.put(
    `/contracts/${contractId}/sign/owner`
  );
},

};

export default contractService;